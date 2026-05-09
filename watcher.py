import argparse
import json
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_CONFIG_PATH = "config.json"


def load_config(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as config_file:
        config = json.load(config_file)

    endpoint = config.get("endpoint", {})
    if "url" not in endpoint:
        raise ValueError('config.json deve conter "endpoint.url".')

    interval_ms = int(config.get("interval_ms", 1000))
    if interval_ms <= 0:
        raise ValueError('"interval_ms" deve ser maior que zero.')

    return config


def build_url(config: dict[str, Any]) -> str:
    endpoint = config["endpoint"]
    base_url = endpoint["url"].rstrip("/")
    path = endpoint.get("path", "")

    if endpoint.get("port"):
        base_url = f"{base_url}:{endpoint['port']}"

    if path and not path.startswith("/"):
        path = f"/{path}"

    return f"{base_url}{path}"


def fetch_json(url: str, timeout_seconds: float) -> Any:
    request = Request(url, headers={"Accept": "application/json"})
    with urlopen(request, timeout=timeout_seconds) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return json.loads(response.read().decode(charset))


def normalized_json(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def load_existing_samples(samples_dir: Path) -> set[str]:
    samples = set()

    for sample_path in samples_dir.glob("*.json"):
        try:
            with sample_path.open("r", encoding="utf-8") as sample_file:
                samples.add(normalized_json(json.load(sample_file)))
        except (json.JSONDecodeError, OSError) as error:
            print(f"[aviso] ignorando sample invalido {sample_path}: {error}")

    return samples


def get_map_type(data: Any) -> str:
    if isinstance(data, dict):
        map_data = data.get("map")
        if isinstance(map_data, dict):
            map_type = map_data.get("type")
            if map_type:
                return str(map_type)

    return "unknown"


def safe_filename_part(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "_", value.strip())
    return cleaned.strip("._") or "unknown"


def save_sample(samples_dir: Path, data: Any) -> Path:
    map_type = safe_filename_part(get_map_type(data))
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
    sample_path = samples_dir / f"{map_type}_{timestamp}.json"

    with sample_path.open("w", encoding="utf-8") as sample_file:
        json.dump(data, sample_file, ensure_ascii=False, indent=2, sort_keys=True)
        sample_file.write("\n")

    return sample_path


def run(config_path: Path) -> None:
    config = load_config(config_path)
    url = build_url(config)
    interval_seconds = int(config.get("interval_ms", 1000)) / 1000
    timeout_seconds = float(config.get("timeout_seconds", 5))
    samples_dir = Path(config.get("output_dir", "samples"))
    samples_dir.mkdir(parents=True, exist_ok=True)

    print(f"Observando {url}")
    print(f"Intervalo: {int(interval_seconds * 1000)} ms")
    print(f"Saida: {samples_dir.resolve()}")

    while True:
        try:
            response_json = fetch_json(url, timeout_seconds)
            normalized_response = normalized_json(response_json)
            existing_samples = load_existing_samples(samples_dir)

            if normalized_response not in existing_samples:
                sample_path = save_sample(samples_dir, response_json)
                print(f"[novo] {sample_path}")
            else:
                print("[igual] resposta ja registrada")
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, OSError) as error:
            print(f"[erro] {error}")

        time.sleep(interval_seconds)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Observa um endpoint JSON e grava somente respostas ainda nao registradas."
    )
    parser.add_argument(
        "-c",
        "--config",
        default=DEFAULT_CONFIG_PATH,
        help=f"Arquivo de configuracao. Padrao: {DEFAULT_CONFIG_PATH}",
    )
    args = parser.parse_args()

    run(Path(args.config))


if __name__ == "__main__":
    main()

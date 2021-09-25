const debug = true
const holyricsServer = 'http://192.168.1.54/stage-view/text.json'
const usedAnimations = 'animate__fadeIn animate__fadeInUp animate__fadeInRight animate__fadeInDown animate__fadeInLeft animate__fadeOut animate__fadeOutUp animate__fadeOutRight animate__fadeOutDown animate__fadeOutLeft animate__flipInX animate__flipOutX'

function log(a) {
  if (!debug)
    return
  if (arguments && arguments.length > 1) {
    var formatArgs = [].slice.call(arguments).slice(1)
    a = arguments[0].replace(/{(\d+)}/g, (rgx, n) => typeof formatArgs[n] != 'undefined' ? formatArgs[n] : rgx)
  }
  console.log(a)
}
function logstatus(a) { 
  log('>>> LOG STATUS : {0}', a) 
}

function getStyleVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name)
}
function getAnimateCssDelay() {
  var value = getStyleVar('--animate-duration')
  return ((parseInt(value.match(/\d+/))) * (value.match(/\d+s/) ? 1000 : 1))
}

var app = {
  bible: {
    versicleAnimation: 'NEXT',
    opened: {
      book: '',
      chapter: '',
      versicle: '',
    },
    order: [
      "Gênesis",
      "Êxodo",
      "Levítico",
      "Números",
      "Deuteronômio",
      "Josué",
      "Juízes",
      "Rute",
      "1 Samuel",
      "2 Samuel",
      "1 Reis",
      "2 Reis",
      "1 Crônicas",
      "2 Crônicas",
      "Esdras",
      "Neemias",
      "Ester",
      "Jó",
      "Salmos",
      "Provérbios",
      "Eclesiastes",
      "Cantares",
      "Isaías",
      "Jeremias",
      "Lamentações",
      "Ezequiel",
      "Daniel",
      "Oséias",
      "Joel",
      "Amós",
      "Obadias",
      "Jonas",
      "Miquéias",
      "Naum",
      "Habacuque",
      "Sofonias",
      "Ageu",
      "Zacarais",
      "Malaquias",
      "Mateus",
      "Marcos",
      "Lucas",
      "João",
      "Atos",
      "Romanos",
      "1 Coríntios",
      "2 Coríntios",
      "Gálatas",
      "Efésios",
      "Filipenses",
      "Colossenses",
      "1 Tessalonicenses",
      "2 Tessalonicenses",
      "1 Timóteo",
      "2 Timóteo",
      "Tito",
      "Filemon",
      "Hebreus",
      "Tiago",
      "1 Pedro",
      "2 Pedro",
      "1 João",
      "2 João",
      "3 João",
      "Judas",
      "Apocalipse"
    ],
    data: {
      header: null,
      text: null,
      translation: null
    },
    get: {
      container:   function() { return $('.bible') },
      header:      function() { return $('.bible .header') },
      text:        function() { return $('.bible .text') },
      translation: function() { return $('.bible .translation') },
    },
    close: function() {
      //log('app.bible.close()')
      app.bible.data = {
        header: null,
        text: null,
        translation: null
      }
      app.close('.bible','animate__fadeOut', 'animate__fadeIn')
    },
    show: function(holyricsRawData) {
      //log('app.bible.show()')
      var data
      try {
        data = {
          header:      holyricsRawData.header.match(/\>(.*?)\</)[1],
          text:        holyricsRawData.text.match(/\<ctt\>(.*?)\<\/ctt\>/)[1],
          translation: holyricsRawData.text.match(/<\s*span[^>]*>(.*?)<\s*\/\s*span>/)[1]
        }
      } catch (ex) {
        if (app.bible.get.container().is(":visible"))
          app.bible.close()
        log(holyricsRawData)
        throw ex
      }
      // log("app.bible.data ({0}) EQUALS data ({1})", JSON.stringify(app.bible.data), JSON.stringify(data))
      // log('RESULT <<<<<  {0}  >>>>>', _.isEqual(app.bible.data, data))
      if (_.isEqual(app.bible.data, data))
        return
      logstatus('app.bible.show() <= "show versicle"')
      var content =
        '<p class="header animate__animated">'+data.header+'</p>'+
        '<p class="text animate__animated">'+data.text+'</p>'+
        '<p class="translation animate__animated">'+data.translation+'</p>'
      let headerMatch = data.header.match(/(.*)\s(\d+)\:(\d+)/)
      let opened = { 
        book: headerMatch[1], 
        chapter: headerMatch[2], 
        versicle: headerMatch[3] 
      }
      if (opened.book != app.bible.opened.book) {
        for (let i = 0; i < app.bible.order.length; i++) {
          if (opened.book === app.bible.order[i]) {
            app.bible.versicleAnimation = (app.bible.order.indexOf(app.bible.opened.book) < i) ? 'NEXT' : 'BACK'
            break
          }
        }
      } else {
        if (app.bible.opened.chapter === opened.chapter) {
          app.bible.versicleAnimation = (app.bible.opened.versicle > opened.versicle) ? 'BACK' : 'NEXT'
          console.log(`${app.bible.opened.versicle} > ${opened.versicle}`)
          console.log(`VERSICLE -- ${app.bible.versicleAnimation}`)
        } else {
          app.bible.versicleAnimation = (app.bible.opened.chapter > opened.chapter) ? 'BACK' : 'NEXT'
          console.log(`${app.bible.opened.chapter} > ${opened.chapter}`)
          console.log(`chapter -- ${app.bible.versicleAnimation}`)
        }
      }
      app.bible.opened = opened
      app.bible.data = data
      app.bible.append(content)
    },
    append: function(e) {
      //log('app.bible.append()')
      if (app.lyrics.get.container().is(':visible'))
        app.lyrics.get.container().hide()
      var container = app.bible.get.container()
      if (container.is(":hidden")) {
        container.html(null).append(e).show()
      } else {
        var header = app.bible.get.header()
        header
          .removeClass(usedAnimations)
          .addClass('animate__fadeOut')
        $($(e)[0]).addClass('animate__fadeIn').appendTo(container)

        console.log(`app.bible.versicleAnimation == ${app.bible.versicleAnimation}`)
        var text = app.bible.get.text()
        text
          .removeClass(usedAnimations)
          .addClass(app.bible.versicleAnimation === 'NEXT' ? 'animate__fadeOutLeft' : 'animate__fadeOutRight')
          $($(e)[1]).addClass(app.bible.versicleAnimation === 'NEXT' ? 'animate__fadeInRight' : 'animate__fadeInLeft').appendTo(container)

        var translation = app.bible.get.translation()
        translation
          .removeClass(usedAnimations)
          .addClass('animate__fadeOut')
        $($(e)[2]).addClass('animate__fadeIn').appendTo(container)

        setTimeout(() => {
          header.remove()
          text.remove()
          translation.remove()
        }, getAnimateCssDelay())
      }
    }
  },
  lyrics: {
    data: {
      title: null,
      artist: null,
      verse: null
    },
    get: {
      container: function() { return $('.music') },
      title:     function() { return $('.music .title') },
      artist:    function() { return $('.music .artist') },
      verse:     function() { return $('.music .verse') },
    },
    close: function() {
      //log('app.lyrics.close()')
      app.lyrics.data = {
        title: null,
        artist: null,
        verse: null
      }
      app.close('.music','animate__fadeOutDown', 'animate__fadeInUp')
    },
    show: function(holyricsRawData) {
      //log('app.lyrics.show()')
      if (app.bible.get.container().is(':visible'))
        app.bible.get.container().hide()
      var data = {
        showTitle: holyricsRawData.custom_class === 'music_title',
        title:     holyricsRawData.$system_var_music_title,
        artist:    holyricsRawData.$system_var_music_artist.length ? holyricsRawData.$system_var_music_artist : holyricsRawData.$system_var_music_author,
        verse:    !holyricsRawData.text.replace(/\<span.*\<\/span\>/g, '').replace(/^\s/g,'').length ? null : (holyricsRawData.text.replace(/(?:\r\n|\r|\n)/g, '<br/>').replace(/\<span.*\<\/span\>/g, '')).trim()
      }
      if (data.showTitle) {
        logstatus('app.lyrics.show() <= "show title"')
        //log('app.lyrics.data.title("{0}")  <>  data.title("{1}")', app.lyrics.data.title, data.title)
        //log('app.lyrics.data.artist("{0}") <> data.artist("{1}")', app.lyrics.data.artist, data.artist)
        if (app.lyrics.data.title != data.title || app.lyrics.data.artist != data.artist) {
          var content =
            '<div class="title animate__animated">'+
            '  <p class="name">'+data.title+'</p>'+
            '  <p class="artist">'+data.artist+'</p>'+
            '</div>'
          app.lyrics.append(content)
          app.lyrics.data = {
            title: data.title,
            artist: data.artist
          }
        }
      } else if (data.verse && data.verse.length) {
        logstatus('app.lyrics.show() <= "show verse"')
        //log('app.lyrics.data.verse("{0}")  <>  data.verse("{1}")', app.lyrics.data.verse, data.verse)
        if (app.lyrics.data.verse != data.verse) {
          var content = '<div class="verse animate__animated">'+data.verse+'</div>'
          app.lyrics.append(content)
          app.lyrics.data = {
            verse: data.verse
          }
        }
      } else {
        logstatus('app.lyrics.show() <= "hide"')
        if (app.lyrics.get.container().is(":visible") || 
           (app.lyrics.data.title != null ||
            app.lyrics.data.artist != null ||
            app.lyrics.data.verse != null))
          app.lyrics.close()
      }
    },
    append: function(e) {
      //log('app.lyrics.append()')
      var container = app.lyrics.get.container()
      if (container.is(":hidden")) {
        container.html(null).append(e).show()
      } else {
        var content = container.children().first()
        content
          .removeClass(usedAnimations)
          .addClass('animate__flipOutX')
          .css({
            'position': 'absolute',
            'bottom': '0',
            'left': '0',
            'right': '0',
          })
          $(e).addClass('animate__flipInX').appendTo(container)
          setTimeout(() => {
            content.remove()
          }, getAnimateCssDelay())
      }
    }
  },
  text: {
    show: function(holyricsRawData) {
      //log('app.lyrics.show()')
      var crono = holyricsRawData.text.match(/^(\d+\:\d+)\<span/)
      $('.container-crono > p').html(crono[1])
      if ($('.container-crono').is(":hidden"))
        $('.container-crono').show()
      if (crono[1].match(/^(0+\:0+)$/))
        $('.container-crono').hide()
    },
  },
  //
  // generic functions
  //
  close: function(e, an_out, an_in) {
    //log('app.lyrics.close()')
    var element = $(e)
    element.removeClass(usedAnimations)
    element.addClass(an_out)
    setTimeout(() => {
      element.hide()
      element.removeClass(usedAnimations)
      element.addClass(an_in)
      element.html(null)
    }, getAnimateCssDelay())
  }
}

$(function() {
  setInterval(function() {
    $.get(holyricsServer).done(function(response) {
      if (response.reload === "_true")
        return
      switch (response.map.type.toUpperCase()) {
        case 'EMPTY':
          logstatus('holyrics.types.empty')
          if (app.lyrics.get.container().is(":visible")) app.lyrics.close()
          if (app.bible.get.container().is(":visible")) app.bible.close()
          if ($('.container-crono').is(":visible")) $('.container-crono').hide()
          break
        case 'MUSIC':
          logstatus('holyrics.types.music')
          app.lyrics.show(response.map)
          break;
        case 'BIBLE':
          logstatus('holyrics.types.bible')
          app.bible.show(response.map)
          break;
        case 'TEXT':
          logstatus('holyrics.types.text')
          app.text.show(response.map)
          break;
        default:
          throw "exception: unhandled 'holyrics.type' = " + response.map.type
      }
    })
    .fail(function() {
      if (app.lyrics.get.container().is(":visible")) app.lyrics.close()
      if (app.bible.get.container().is(":visible")) app.bible.close()
    })
  }, getAnimateCssDelay()+100)
})
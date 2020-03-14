export const viewportMeta = `<meta name="viewport" content="width=device-width, initial-scale=1">`
export const nojsScript = `
  <script>
    if ('querySelector' in document && 'addEventListener' in window)
      document.documentElement.className = 'js*'
  </script>
`

export const detectIE = `<script>/*@cc_on @if (@_jscript_version <= 10) document.documentElement.className += ' lteIE10*'; @end @*/</script>`

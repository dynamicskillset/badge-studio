export class Palette {
  constructor(colors) {
    this._colors = {}
    if (colors) {
      for (const color in colors) {
        if (Object.prototype.hasOwnProperty.call(colors, color)) {
          this._colors[color] = Palette.parseColor(colors[color])
        }
      }
    }
    if (!Object.prototype.hasOwnProperty.call(this._colors, 'glyph')) {
      this._colors['glyph'] = '#000000'
    }
  }

  toNode(id) {
    const content = []
    for (const color in this._colors) {
      if (Object.prototype.hasOwnProperty.call(this._colors, color)) {
        content.push(`.color-${color} { fill: ${this._colors[color]}; }`)
      }
    }
    const $node = document.createElement('style')
    $node.type = 'text/css'
    $node.id = id || 'palette'
    $node.textContent = content.join('\n')
    return $node
  }

  colors() {
    return Object.keys(this._colors)
  }

  color(name) {
    return this._colors[name] || '#000'
  }

  static parseColor(str) {
    if (!/^#[a-f0-9]{3}$/i.test(str)) return str.toLowerCase()
    return '#' + str.charAt(1) + str.charAt(1)
               + str.charAt(2) + str.charAt(2)
               + str.charAt(3) + str.charAt(3)
  }

  static fromDataset(dataset) {
    const colors = {}
    for (const item in dataset) {
      if (/^color\w+/i.test(item)) {
        const color = item
          .replace(/^color(\w)/i, (m, c) => c.toLowerCase())
          .replace(/[A-Z]/, m => '-' + m.toLowerCase())
        colors[color] = dataset[item]
      }
    }
    return new Palette(colors)
  }

  static fromSVG($svg) {
    const colors = {}
    const $node = $svg.getElementById('palette')
    if (!$node || $node.nodeName !== 'style') return new Palette()

    const $stylesheet = document.createElement('style')
    $stylesheet.setAttribute('media', 'print')
    $stylesheet.appendChild(document.createTextNode($node.textContent))
    document.head.appendChild($stylesheet)
    const sheet = $stylesheet.sheet
    document.head.removeChild($stylesheet)

    const rules = sheet.rules || sheet.cssRules
    for (let i = 0, l = rules.length; i < l; i++) {
      const rule = rules[i]
      const selector = rule.selectorText
      if (/^\.color-/.test(selector)) {
        const key = selector.replace(/^\.color-/, '')
        const value = rule.style.fill || '#000'
        colors[key] = value
      }
    }
    return new Palette(colors)
  }
}

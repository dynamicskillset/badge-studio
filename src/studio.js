import { Palette } from './palette.js'
import { icons } from './icons.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

const svgCache = {}
const options = {}

let $badge
let $badgeRaster
const $studio = document.getElementById('studio')

const $template = document.getElementById('studio-template')
const $palette = document.getElementById('studio-palette')
const $mask = document.getElementById('studio-mask')
const $glyph = document.getElementById('studio-glyph')

let $glyphSelector
let $glyphSelectorButton

let $settings
let $settingsButton

let $about
let $aboutButton

let $downloadModal
let $downloadModalButton

// ==[ General Methods ]======================================================

function showError(err) {
  console.error(err)
}

// ==[ Studio ]===============================================================

export function initStudio() {
  $badgeRaster = new Image()
  $badgeRaster.id = 'raster'
  document.getElementById('output').appendChild($badgeRaster)

  $template.addEventListener('change', () => updateTemplate().catch(showError))
  $palette.addEventListener('change', () => updatePalette().catch(showError))
  $mask.addEventListener('change', () => updateMask().catch(showError))
  $glyph.addEventListener('change', () => updateGlyph().catch(showError))

  initAbout()
  initDownload()
  initPalettes()
  initOptions()
  initGlyphs()
  initGlyphSelector()

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if ($settings && $settings.offsetWidth) closeSettings()
      else if ($about && $about.offsetWidth) closeAbout()
      else if ($downloadModal && $downloadModal.offsetWidth) closeDownloadModal()
      else if ($glyphSelector && $glyphSelector.offsetWidth) closeGlyphSelector()
    }
  }, true)

  document.addEventListener('focus', event => {
    for (const $overlay of [$settings, $about, $downloadModal, $glyphSelector]) {
      if ($overlay && $overlay.offsetWidth && !$overlay.contains(event.target)) {
        event.stopPropagation()
        $overlay.focus()
      }
    }
  }, true)

  updateTemplate().catch(showError)
}

// ==[ Settings ]=============================================================

function initSettings() {
  if ($settings) return

  $settingsButton = document.createElement('button')
  $settingsButton.className = 'settings fa-solid fa-gear'
  $settingsButton.title = 'Settings'
  $settingsButton.addEventListener('click', openSettings)
  $studio.appendChild($settingsButton)

  $settings = importTemplate('settings').querySelector('#settings')
  $settings.querySelector('.header').appendChild(makeCloseButton(closeSettings))
  $studio.appendChild($settings)

  $settings.addEventListener('change', event => {
    const $target = event.target
    handleUpdate($target.name, $target.value)
  })

  if (!window.localStorage) return

  const $$options = $settings.querySelectorAll('select')
  for (let i = 0, l = $$options.length; i < l; i++) {
    const $option = $$options[i]
    const name = $option.name
    const value = localStorage.getItem($option.name)
    for (let j = 0; j < $option.length; j++) {
      if ($option[j].value === value) {
        $option.selectedIndex = j
        handleUpdate(name, value)
        break
      }
    }
  }

  function handleUpdate(name, value) {
    switch (name) {
      case 'display':
        document.body.className = value
        break
      case 'badge-size': {
        const scale = parseFloat(value)
        $badgeRaster.style.transform = `scale(${scale})`
        break
      }
      default:
        name = null
    }
    if (name && window.localStorage) localStorage.setItem(name, value)
  }
}

function openSettings() {
  if (!$settings) initSettings()
  $settings.classList.remove('hidden')
  $settings.focus()
}

function closeSettings() {
  if (!$settings) return
  $settings.classList.add('hidden')
  $settingsButton.focus()
}

// ==[ About ]================================================================

function initAbout() {
  if ($about) return

  $aboutButton = document.createElement('button')
  $aboutButton.className = 'about fa-solid fa-circle-info'
  $aboutButton.title = 'About'
  $aboutButton.setAttribute('aria-label', 'About Badge Studio')
  $aboutButton.addEventListener('click', openAbout)
  $studio.appendChild($aboutButton)

  $about = importTemplate('about').querySelector('#about')
  $about.querySelector('.header').appendChild(makeCloseButton(closeAbout))
  $studio.appendChild($about)
}

function openAbout() {
  if (!$about) initAbout()
  $about.classList.remove('hidden')
  $about.focus()
}

function closeAbout() {
  if (!$about) return
  $about.classList.add('hidden')
  $aboutButton.focus()
}

// ==[ Download ]=============================================================

function initDownload() {
  $downloadModalButton = document.getElementById('download-btn')
  if (!$downloadModalButton) return

  $downloadModalButton.addEventListener('click', openDownloadModal)

  $downloadModal = importTemplate('download-modal').querySelector('#download-modal')
  $downloadModal.querySelector('.header').appendChild(makeCloseButton(closeDownloadModal))
  $studio.appendChild($downloadModal)

  $downloadModal.querySelector('#download-png-btn').addEventListener('click', () => {
    if (!$badgeRaster.src) return
    triggerDownload('badge.png', $badgeRaster.src)
    closeDownloadModal()
  })

  $downloadModal.querySelector('#download-svg-btn').addEventListener('click', () => {
    if (!$badge) return
    const svg_xml = (new XMLSerializer()).serializeToString($badge)
    const blob = new Blob([svg_xml], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    triggerDownload('badge.svg', url)
    URL.revokeObjectURL(url)
    closeDownloadModal()
  })
}

function openDownloadModal() {
  if (!$downloadModal) return
  $downloadModal.classList.remove('hidden')
  $downloadModal.focus()
}

function closeDownloadModal() {
  if (!$downloadModal) return
  $downloadModal.classList.add('hidden')
  $downloadModalButton.focus()
}

// ==[ Glyph Selector ]=======================================================

function initGlyphSelector() {
  if ($glyphSelector) return

  const glyphLog = []

  $glyphSelectorButton = document.createElement('button')
  $glyphSelectorButton.id = 'search-glyphs'
  $glyphSelectorButton.type = 'button'
  $glyphSelectorButton.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Browse icons'
  $glyphSelectorButton.addEventListener('click', openGlyphSelector)

  $glyph.parentNode.insertBefore($glyphSelectorButton, $glyph.nextSibling)

  const $$options = $glyph.querySelectorAll('option')

  $glyphSelector = importTemplate('glyph-selector', $t => {
    const $list = $t.querySelector('ul')

    for (let i = 0, l = $$options.length; i < l; i++) {
      (($option, index) => {
        const value = $option.value
        if (!value) return  // skip "None" option
        const iconType = $option.dataset.type || 'solid'
        const id = 'glyph-selector-item-' + value

        const $node = importTemplate('glyph-selector-item', $t2 => {
          const $input = $t2.querySelector('input')
          $input.id = id
          $input.value = index

          const checked = $glyph.selectedIndex === index
          if (checked) $input.setAttribute('checked', 'checked')
          else $input.removeAttribute('checked')

          const $label = $t2.querySelector('label')
          $label.id = id + '-label'
          $label.className = iconType === 'brands' ? `fa-brands fa-${value}` : `fa-solid fa-${value}`
          $label.setAttribute('for', id)
          $label.setAttribute('title', $option.text)
        }).querySelector('li')

        $list.appendChild($node)

        glyphLog.push({ id, value })
      })($$options[i], i)
    }
  }).querySelector('#glyph-selector')

  const $filter = $glyphSelector.querySelector('input')
  let filterTimer

  function filterGlyphs() {
    clearTimeout(filterTimer)
    filterTimer = setTimeout(() => {
      const query = ($filter.value || '').toLowerCase()
      for (let i = 0, l = glyphLog.length; i < l; i++) {
        const entry = glyphLog[i]
        if (!entry.el) entry.el = document.getElementById(entry.id).parentNode
        if (query && entry.value.indexOf(query) === -1) {
          entry.el.style.display = 'none'
        } else {
          entry.el.style.display = ''
        }
      }
    }, 250)
  }

  $glyphSelector.querySelector('.header').appendChild(makeCloseButton(closeGlyphSelector))
  $studio.appendChild($glyphSelector)

  $glyphSelector.addEventListener('change', event => {
    if (event.target === $filter) return filterGlyphs()
    event.stopPropagation()
    const index = event.target.value
    $glyph.selectedIndex = index
    updateGlyph().catch(showError)
  })

  $glyphSelector.addEventListener('click', event => {
    if (event.target.nodeName.toLowerCase() !== 'label') return
    event.stopPropagation()
    closeGlyphSelector()
  })

  $glyphSelector.addEventListener('keydown', event => {
    if (event.target === $filter) return filterGlyphs()

    if (event.key === 'Enter') {
      if (event.target.name) $glyph.selectedIndex = event.target.value
      updateGlyph().then(closeGlyphSelector).catch(showError)
      return
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()

      const $container = event.target.parentNode.parentNode
      const itemSize = event.target.parentNode.offsetWidth
      const containerSize = $container.offsetWidth
      const rowCount = Math.floor(containerSize / itemSize)
      const currentIndex = parseInt(event.target.value)
      let newIndex
      let altFinder

      if (event.key === 'ArrowUp') {
        newIndex = currentIndex - rowCount
        altFinder = 'firstElementChild'
      } else {
        newIndex = currentIndex + rowCount
        altFinder = 'lastElementChild'
      }

      const newItem = $container.querySelector(`input[value="${newIndex}"]`) ||
                      $container[altFinder].querySelector('input')

      $glyph.selectedIndex = newItem.value
      newItem.checked = true
      newItem.focus()
      rasterize().catch(showError)
    }
  })

  $glyphSelector.addEventListener('search', event => {
    if (event.target === $filter) filterGlyphs()
  })

  $glyphSelector.addEventListener('focus', event => {
    if (event.target !== $glyphSelector) return
    event.stopPropagation()
    $filter.focus()
  }, true)

  $glyph.addEventListener('change', function () {
    const $selectorItem = document.getElementById('glyph-selector-item-' + this.value)
    if ($selectorItem) $selectorItem.click()
  })
}

function openGlyphSelector() {
  if (!$glyphSelector) initGlyphSelector()
  $glyphSelector.classList.remove('hidden')
  if ($glyph.value) {
    const el = document.getElementById('glyph-selector-item-' + $glyph.value + '-label')
    if (el) el.focus()
  }
  $glyphSelector.focus()
}

function closeGlyphSelector() {
  if (!$glyphSelector) return
  $glyphSelector.classList.add('hidden')
  $glyphSelectorButton.focus()
}

// ==[ Templates ]============================================================

async function updateTemplate() {
  const path = $template.dataset.path
  const shape = $template.value
  const $svg = await loadSVG(`${path}/${shape}.svg`)

  $badge = $svg

  extractOptions()
  setCustomPalette($svg)
  await updatePalette()
}

// ==[ Palettes ]=============================================================

function initPalettes() {
  const $custom = document.createElement('option')
  $custom.disabled = true
  $custom.value = 'custom'
  $custom.text = 'Custom'
  $custom.id = 'custom-color-option'
  $palette.options.add($custom)

  const $container = document.getElementById('custom-palette')

  $palette.addEventListener('change', function () {
    const isCustom = (this.options[this.selectedIndex] === $custom)
    $custom.disabled = !isCustom
    setCustomColors()
    updatePalette().catch(showError)
  })

  $container.addEventListener('change', event => {
    const $input = event.target
    $custom.setAttribute('data-color-' + $input.name, $input.value)
    $custom.disabled = false
    $palette.selectedIndex = $palette.options.length - 1
    updatePalette().catch(showError)
  })

  setCustomColors()
}

function getCurrentPalette() {
  const $option = $palette.options[$palette.selectedIndex]
  return Palette.fromDataset($option.dataset)
}

async function updatePalette() {
  const $oldPalette = $badge.getElementById('palette')
  const $newPalette = getCurrentPalette().toNode()

  if ($oldPalette) {
    $oldPalette.parentNode.insertBefore($newPalette, $oldPalette)
    $oldPalette.parentNode.removeChild($oldPalette)
  } else {
    let $defs = $badge.querySelector('defs') || document.createElementNS(SVG_NS, 'defs')
    if (!$defs.parentNode) $badge.insertBefore($defs, $badge.childNodes[0])
    $defs.appendChild($newPalette)
  }

  await updateGlyph()
}

function setCustomPalette($svg) {
  const colors = Palette.fromSVG($svg).colors()
  const $container = document.getElementById('custom-palette')
  const display = $container.style.display
  $container.innerHTML = ''
  $container.style.display = 'none'
  $container.className = 'item'

  for (let i = 0, l = colors.length; i < l; i++) {
    const name = colors[i]
    const displayNames = { glyph: 'Icon colour', background: 'Background', stitching: 'Stitching', border: 'Border', detail: 'Detail' }
    const label = displayNames[name] || name.replace(/(^|-)(\w)/g, (m, x, c) => (x ? ' ' : '') + c.toUpperCase())

    $container.appendChild(importTemplate('custom-color', $t => {
      const $input = $t.querySelector('input')
      $input.name = name
      $input.id = 'custom-color-picker-' + name
      const $label = $t.querySelector('span')
      $label.textContent = label
    }))
  }

  if (colors.length) $container.style.display = display
  setCustomColors()
}

function setCustomColors() {
  const $custom = document.getElementById('custom-color-option')
  const $option = $palette.options[$palette.selectedIndex]
  const palette = Palette.fromDataset($option.dataset)
  const colors = palette.colors()

  for (let i = 0, l = colors.length; i < l; i++) {
    const colorName = colors[i]
    const colorValue = palette.color(colorName)
    $custom.setAttribute('data-color-' + colorName, colorValue)
    const $input = document.getElementById('custom-color-picker-' + colorName)
    if ($input) $input.value = colorValue
  }
}

// ==[ Masks ]================================================================

async function updateMask() {
  const path = $mask.dataset.path
  const maskName = $mask.value

  let $svg
  if (!maskName) {
    $svg = document.createElementNS(SVG_NS, 'svg')
    const $g = document.createElementNS(SVG_NS, 'g')
    $g.id = 'mask'
    $svg.appendChild($g)
  } else {
    $svg = await loadSVG(`${path}/${maskName}.svg`)
  }

  const $oldMask = $badge.querySelector('#mask')
  const $newMask = $svg.querySelector('#mask')

  $oldMask.parentNode.insertBefore($newMask, $oldMask)
  $oldMask.parentNode.removeChild($oldMask)

  await rasterize()
}

// ==[ Options ]==============================================================

function initOptions() {
  if ($badge) extractOptions()

  const $options = document.getElementById('options')
  $options.addEventListener('change', event => {
    event.stopPropagation()
    const option = event.target.name
    if (!Object.prototype.hasOwnProperty.call(options, option)) return

    options[option] = !!event.target.checked
    setOptions().catch(showError)
  })
}

function extractOptions() {
  const $options = document.getElementById('options')
  $options.innerHTML = ''

  const $optional = $badge.querySelectorAll('.optional')

  if (!$optional.length) {
    $options.innerHTML = '<i>None</i>'
    return
  }

  for (let i = 0, l = $optional.length; i < l; i++) {
    const $option = $optional[i]
    const label = $option.getAttribute('title')
    const name = $option.id
    const enabled = ($option.getAttribute('display') !== 'none')
    if (!Object.prototype.hasOwnProperty.call(options, name)) options[name] = enabled

    $option[!!options[name] ? 'removeAttribute' : 'setAttribute']('display', 'none')

    $options.appendChild(importTemplate('option', $t => {
      const $checkbox = $t.querySelector('input')
      $checkbox.name = name
      $checkbox.checked = !!options[name]
      const $label = $t.querySelector('span')
      $label.textContent = label
    }))
  }
}

async function setOptions() {
  if (!$badge) return

  for (const option in options) {
    if (Object.prototype.hasOwnProperty.call(options, option)) {
      const $node = $badge.getElementById(option)
      const visible = !!options[option]
      if ($node) $node[visible ? 'removeAttribute' : 'setAttribute']('display', 'none')
    }
  }

  await rasterize()
}

// ==[ Glyphs ]===============================================================

function initGlyphs() {
  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i]
    const $option = document.createElement('option')
    $option.value = icon.value
    $option.text = icon.label
    $option.dataset.type = icon.type || 'solid'
    $glyph.add($option)
  }
}

function getCurrentGlyphValue() {
  if (!$glyph.value) return ''

  const selectedOption = $glyph.options[$glyph.selectedIndex]
  const type = selectedOption?.dataset.type || 'solid'

  const $i = document.createElement('i')
  $i.className = type === 'brands' ? `fa-brands fa-${$glyph.value}` : `fa-solid fa-${$glyph.value}`
  document.body.appendChild($i)
  const chr = window.getComputedStyle($i, ':before').content.replace(/["']/g, '')
  document.body.removeChild($i)

  return chr
}

async function updateGlyph() {
  // Wait for webfonts before attempting canvas render
  await document.fonts.ready

  const glyph = getCurrentGlyphValue()

  if (!glyph) {
    await setGlyphImage(null)
    return
  }

  const selectedOption = $glyph.options[$glyph.selectedIndex]
  const type = selectedOption?.dataset.type || 'solid'

  const $canvas = document.createElement('canvas')
  $canvas.width = parseInt($badgeRaster.offsetWidth) || 512
  $canvas.height = parseInt($badgeRaster.offsetHeight) || 512

  const ctx = $canvas.getContext('2d')
  const size = parseInt($canvas.width / 3)
  const fontFamily = type === 'brands' ? '"Font Awesome 6 Brands"' : '"Font Awesome 6 Free"'
  const fontWeight = type === 'brands' ? '400' : '900'

  ctx.font = `${fontWeight} ${size}px ${fontFamily}`
  ctx.fillStyle = getCurrentPalette().color('glyph')
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.shadowBlur = 5

  ctx.fillText(glyph, $canvas.width / 2, $canvas.height / 2)

  await new Promise(resolve => {
    const $image = new Image()
    $image.onload = () => setGlyphImage($image).then(resolve)
    $image.src = $canvas.toDataURL('image/png')
  })
}

async function setGlyphImage($image) {
  const $newGlyph = document.createElementNS(SVG_NS, 'g')
  $newGlyph.id = 'glyph'

  if ($image) {
    const iWidth = $image.width
    const iHeight = $image.height

    const rWidth = $badgeRaster.width || 512
    const rHeight = $badgeRaster.height || 512

    const box = $badge.getAttribute('viewBox').split(' ')
    const bWidth = parseInt(box[2])
    const bHeight = parseInt(box[3])

    const cx = bWidth / 2 + parseInt(box[0])
    const cy = bHeight / 2 + parseInt(box[1])

    const gWidth = iWidth / (rWidth / bWidth)
    const gHeight = iHeight / (rHeight / bHeight)
    const gx = cx - (gWidth / 2)
    const gy = cy - (gHeight / 2)

    const $glyphImage = document.createElementNS(SVG_NS, 'image')
    $glyphImage.setAttribute('x', gx)
    $glyphImage.setAttribute('y', gy)
    $glyphImage.setAttribute('width', gWidth)
    $glyphImage.setAttribute('height', gHeight)
    $glyphImage.setAttribute('href', $image.src)
    $newGlyph.appendChild($glyphImage)
  }

  const $oldGlyph = $badge.getElementById('glyph')
  $oldGlyph.parentNode.insertBefore($newGlyph, $oldGlyph)
  $oldGlyph.parentNode.removeChild($oldGlyph)

  await rasterize()
}

// ==[ Helpers ]==============================================================

async function rasterize() {
  const $svg = $badge.cloneNode(true)

  const $canvas = document.createElement('canvas')
  $canvas.width = parseInt($svg.getAttribute('width'))
  $canvas.height = parseInt($svg.getAttribute('height'))

  const ctx = $canvas.getContext('2d')
  const svg_xml = (new XMLSerializer()).serializeToString($svg)
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg_xml)

  await new Promise(resolve => {
    const $img = new Image()
    $img.onload = () => {
      ctx.drawImage($img, 0, 0)
      $badgeRaster.src = $canvas.toDataURL('image/png')
      const $btn = document.getElementById('download-btn')
      if ($btn) $btn.classList.remove('hidden')
      resolve()
    }
    $img.src = url
  })
}

async function loadSVG(path) {
  if (svgCache[path]) return svgCache[path].cloneNode(true)

  const response = await fetch(path)
  if (!response.ok) throw new Error(`Failed to load SVG: ${path} (${response.status})`)

  const text = await response.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'image/svg+xml')
  const svg = doc.getElementsByTagName('svg')[0]

  if (!svg) throw new Error(`No SVG element found in ${path}`)

  svgCache[path] = svg
  return svgCache[path].cloneNode(true)
}

function importTemplate(name, builder) {
  const $tmpl = document.getElementById(name + '-template')
  if (typeof builder === 'function') builder($tmpl.content)
  return document.importNode($tmpl.content, true)
}

function triggerDownload(filename, url) {
  const $a = document.createElement('a')
  $a.download = filename
  $a.href = url
  document.body.appendChild($a)
  $a.click()
  document.body.removeChild($a)
}

function makeCloseButton(callback) {
  const $tmpl = importTemplate('close-button')
  $tmpl.querySelector('button').addEventListener('click', callback)
  return $tmpl
}

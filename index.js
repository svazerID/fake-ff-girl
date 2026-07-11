const { createCanvas, GlobalFonts, loadImage } = require('@napi-rs/canvas')
const path = require('path')
const fs = require('fs')

const ASSETS_DIR = path.join(__dirname, 'assets')

const ASSETS = {
  font: path.join(ASSETS_DIR, 'fonts', 'TeutonNormal.otf'),
}

const LOBBY_COUNT = 20

function getLobbyPath(num) {
  return path.join(ASSETS_DIR, 'lobby', `${num}.jpg`)
}

const config = {
  canvas: { width: 1920, height: 3416 },
  username: {
    a: 2650,
    b: 2790,
    c: 727,
    d: 1319,
    centerX: 1009,
    fontSize: 85,
    maxChars: 20,
  },
  debug: false,
}

function loadFont() {
  if (!fs.existsSync(ASSETS.font)) {
    throw new Error(`Font tidak ditemukan: ${ASSETS.font}`)
  }
  GlobalFonts.registerFromPath(ASSETS.font, 'TeutonNormal')
}

function drawGradientUsername(ctx, username, cfg) {
  const { a, b, c, d, fontSize, maxChars } = cfg
  const name = String(username || 'Player').slice(0, maxChars)
  const boxW = d - c
  const boxH = b - a
  const cx = cfg.centerX ?? (c + boxW / 2)

  let size = fontSize
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  while (size > 12) {
    ctx.font = `${size}px TeutonNormal`
    if (ctx.measureText(name).width <= boxW) break
    size -= 1
  }

  ctx.font = `${size}px TeutonNormal`
  const centerY = a + boxH / 2
  const textW = ctx.measureText(name).width
  const gradX1 = cx - textW / 2
  const gradX2 = cx + textW / 2

  const grad = ctx.createLinearGradient(gradX1, centerY, gradX2, centerY)
  grad.addColorStop(0.00, '#FFFDE7')
  grad.addColorStop(0.35, '#FFE57F')
  grad.addColorStop(0.70, '#FFB300')
  grad.addColorStop(1.00, '#FF8F00')

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.7)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 3
  ctx.shadowOffsetY = 4
  ctx.fillStyle = grad
  ctx.fillText(name, cx, centerY)
  ctx.restore()
}

function drawDebugSafeZone(ctx, cfg) {
  const { a, b, c, d } = cfg
  const x = c
  const y = a
  const w = d - c
  const h = b - a
  const cx = x + w / 2
  const cy = y + h / 2

  ctx.save()
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.85)'
  ctx.strokeRect(x, y, w, h)
  ctx.font = 'bold 22px TeutonNormal'
  ctx.fillStyle = 'rgba(255, 0, 0, 0.9)'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(`safe zone ${w}x${h}`, x + 5, y + 5)
  ctx.strokeStyle = 'rgba(255, 220, 0, 0.85)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(cx - 14, cy)
  ctx.lineTo(cx + 14, cy)
  ctx.moveTo(cx, cy - 14)
  ctx.lineTo(cx, cy + 14)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255, 220, 0, 0.85)'
  ctx.beginPath()
  ctx.arc(cx, cy, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

async function generateFF({ username = 'Player', lobby = null, outputDir = './' } = {}) {
  loadFont()

  const lobbyNum = lobby
    ? Math.max(1, Math.min(Number(lobby), LOBBY_COUNT))
    : Math.floor(Math.random() * LOBBY_COUNT) + 1

  const lobbyPath = getLobbyPath(lobbyNum)

  if (!fs.existsSync(lobbyPath)) {
    throw new Error(`Lobby ${lobbyNum} tidak ditemukan: ${lobbyPath}`)
  }

  const { width, height } = config.canvas
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const lobbyImg = await loadImage(lobbyPath)
  ctx.drawImage(lobbyImg, 0, 0, width, height)

  drawGradientUsername(ctx, username, config.username)

  if (config.debug) drawDebugSafeZone(ctx, config.username)

  const buffer = await canvas.encode('jpeg', 100)

  const outputFolder = path.join(outputDir, 'fake-ff')
  if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true })

  const outputPath = path.join(outputFolder, `${username}.jpg`)
  fs.writeFileSync(outputPath, buffer)

  return {
    status: 'success',
    code: 200,
    username,
    lobby: lobbyNum,
    result: outputPath,
  }
}

module.exports = generateFF
module.exports.generateFF = generateFF
module.exports.config = config

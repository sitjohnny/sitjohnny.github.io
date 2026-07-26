import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { crc32, deflateSync, inflateSync } from 'node:zlib'

const SHEET_URL =
  'https://www.spriters-resource.com/media/assets/49/52432.png'
const SOURCE_PAGE =
  'https://www.spriters-resource.com/game_boy_advance/pokemonfireredleafgreen/asset/52432/'
const EXPECTED_WIDTH = 673
const EXPECTED_HEIGHT = 638
const CELL_WIDTH = 16
const FRAME_HEIGHT = 20
const CELL_CONTENT_Y = 12
const BACKGROUND = [255, 127, 39, 255]

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appDir = dirname(scriptDir)
const cachePath = join(scriptDir, '.cache', 'frlg-player-sheet.png')
const outputDir = join(appDir, 'src', 'assets', 'player')

const directions = [
  ['down', 42],
  ['up', 75],
  ['left', 108],
  ['right', 141],
]
const poses = [
  ['0', 25],
  ['1', 8],
  ['2', 42],
]

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function loadSheet() {
  try {
    return await readFile(cachePath)
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error
    }
  }

  const response = await fetch(SHEET_URL, {
    headers: {
      Referer: SOURCE_PAGE,
      'User-Agent':
        'Mozilla/5.0 (compatible; PokemonSafariAssetSlicer/1.0; +https://github.com/sitjohnny/sitjohnny.github.io)',
    },
  })
  assert(response.ok, `Failed to download sprite sheet: HTTP ${response.status}`)

  const sheet = Buffer.from(await response.arrayBuffer())
  await mkdir(dirname(cachePath), { recursive: true })
  await writeFile(cachePath, sheet)
  return sheet
}

function readChunks(png) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  assert(
    png.subarray(0, signature.length).equals(signature),
    'Source is not a PNG file',
  )

  const chunks = []
  let offset = signature.length
  while (offset < png.length) {
    const length = png.readUInt32BE(offset)
    const type = png.toString('ascii', offset + 4, offset + 8)
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    assert(dataEnd + 4 <= png.length, `Truncated PNG chunk: ${type}`)
    chunks.push({ type, data: png.subarray(dataStart, dataEnd) })
    offset = dataEnd + 4
    if (type === 'IEND') {
      break
    }
  }
  return chunks
}

function paethPredictor(left, above, upperLeft) {
  const prediction = left + above - upperLeft
  const leftDistance = Math.abs(prediction - left)
  const aboveDistance = Math.abs(prediction - above)
  const upperLeftDistance = Math.abs(prediction - upperLeft)

  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) {
    return left
  }
  return aboveDistance <= upperLeftDistance ? above : upperLeft
}

function decodeRgbaPng(png) {
  const chunks = readChunks(png)
  const header = chunks.find((chunk) => chunk.type === 'IHDR')?.data
  assert(header?.length === 13, 'PNG is missing a valid IHDR chunk')

  const width = header.readUInt32BE(0)
  const height = header.readUInt32BE(4)
  const bitDepth = header[8]
  const colorType = header[9]
  const compression = header[10]
  const filter = header[11]
  const interlace = header[12]

  assert(
    width === EXPECTED_WIDTH && height === EXPECTED_HEIGHT,
    `Unexpected sheet dimensions: ${width}x${height}`,
  )
  assert(bitDepth === 8 && colorType === 6, 'Expected an 8-bit RGBA PNG')
  assert(compression === 0 && filter === 0, 'Unsupported PNG encoding')
  assert(interlace === 0, 'Interlaced PNGs are not supported')

  const compressed = Buffer.concat(
    chunks.filter((chunk) => chunk.type === 'IDAT').map((chunk) => chunk.data),
  )
  const filtered = inflateSync(compressed)
  const bytesPerPixel = 4
  const stride = width * bytesPerPixel
  assert(
    filtered.length === height * (stride + 1),
    'Unexpected decompressed PNG size',
  )

  const pixels = Buffer.alloc(height * stride)
  let sourceOffset = 0
  for (let y = 0; y < height; y += 1) {
    const filterType = filtered[sourceOffset]
    sourceOffset += 1
    const rowOffset = y * stride
    const previousRowOffset = (y - 1) * stride

    for (let x = 0; x < stride; x += 1) {
      const encoded = filtered[sourceOffset + x]
      const left = x >= bytesPerPixel ? pixels[rowOffset + x - bytesPerPixel] : 0
      const above = y > 0 ? pixels[previousRowOffset + x] : 0
      const upperLeft =
        y > 0 && x >= bytesPerPixel
          ? pixels[previousRowOffset + x - bytesPerPixel]
          : 0

      let predictor
      switch (filterType) {
        case 0:
          predictor = 0
          break
        case 1:
          predictor = left
          break
        case 2:
          predictor = above
          break
        case 3:
          predictor = Math.floor((left + above) / 2)
          break
        case 4:
          predictor = paethPredictor(left, above, upperLeft)
          break
        default:
          throw new Error(`Unsupported PNG filter type: ${filterType}`)
      }
      pixels[rowOffset + x] = (encoded + predictor) & 0xff
    }
    sourceOffset += stride
  }

  return { width, pixels }
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const chunk = Buffer.alloc(12 + data.length)
  chunk.writeUInt32BE(data.length, 0)
  typeBuffer.copy(chunk, 4)
  data.copy(chunk, 8)
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length)
  return chunk
}

function encodeRgbaPng(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header.set([8, 6, 0, 0, 0], 8)

  const stride = width * 4
  const scanlines = Buffer.alloc(height * (stride + 1))
  for (let y = 0; y < height; y += 1) {
    const scanlineOffset = y * (stride + 1)
    scanlines[scanlineOffset] = 0
    pixels.copy(scanlines, scanlineOffset + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    signature,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function cropFrame(sheet, sourceX, sourceY) {
  const frame = Buffer.alloc(CELL_WIDTH * FRAME_HEIGHT * 4)
  let opaquePixels = 0

  for (let y = 0; y < FRAME_HEIGHT; y += 1) {
    for (let x = 0; x < CELL_WIDTH; x += 1) {
      const sourceOffset =
        ((sourceY + CELL_CONTENT_Y + y) * sheet.width + sourceX + x) * 4
      const targetOffset = (y * CELL_WIDTH + x) * 4
      const sourcePixel = sheet.pixels.subarray(sourceOffset, sourceOffset + 4)
      const isBackground = BACKGROUND.every(
        (channel, index) => sourcePixel[index] === channel,
      )

      if (isBackground) {
        frame.set([0, 0, 0, 0], targetOffset)
      } else {
        sourcePixel.copy(frame, targetOffset)
        if (sourcePixel[3] > 0) {
          opaquePixels += 1
        }
      }
    }
  }

  assert(opaquePixels > 0, `Frame at ${sourceX},${sourceY} is empty`)
  for (let offset = 0; offset < frame.length; offset += 4) {
    assert(
      !BACKGROUND.every(
        (channel, index) => frame[offset + index] === channel,
      ),
      `Frame at ${sourceX},${sourceY} still contains the background key`,
    )
  }
  return frame
}

const source = decodeRgbaPng(await loadSheet())
await mkdir(outputDir, { recursive: true })

for (const [direction, sourceY] of directions) {
  for (const [pose, sourceX] of poses) {
    const frame = cropFrame(source, sourceX, sourceY)
    const filename = `red-${direction}-${pose}.png`
    await writeFile(
      join(outputDir, filename),
      encodeRgbaPng(CELL_WIDTH, FRAME_HEIGHT, frame),
    )
    console.log(`Wrote src/assets/player/${filename}`)
  }
}

import { NextResponse, type NextRequest } from 'next/server'
import { Sandbox } from '@vercel/sandbox'

interface Params {
  sandboxId: string
  cmdId: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const logParams = await params
  const encoder = new TextEncoder()
  const sandbox = await Sandbox.get(logParams)
  const command = await sandbox.getCommand(logParams.cmdId)
  console.log(command, logParams)

  return new NextResponse(
    new ReadableStream({
      async pull(controller) {
        for await (const logline of command.logs()) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                data: logline.data,
                stream: logline.stream,
                timestamp: Date.now(),
              }) + '\n'
            )
          )
          console.log(logline)
        }
        controller.close()
      },
    }),
    { headers: { 'Content-Type': 'application/x-ndjson' } }
  )
}

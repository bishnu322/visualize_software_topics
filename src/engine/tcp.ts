import type { Step } from './types'

export type TcpState =
  | 'CLOSED'
  | 'LISTEN'
  | 'SYN_SENT'
  | 'SYN_RECEIVED'
  | 'ESTABLISHED'
  | 'FIN_WAIT_1'
  | 'FIN_WAIT_2'
  | 'CLOSE_WAIT'
  | 'LAST_ACK'
  | 'TIME_WAIT'

export interface TcpSegment {
  from: 'client' | 'server'
  flags: string[]
  seq: number
  ack?: number
  len: number
}

export interface TcpStepData {
  segment: TcpSegment | null
  client: TcpState
  server: TcpState
  phase: 'setup' | 'data' | 'teardown'
}

export interface TcpOptions {
  clientIsn?: number
  serverIsn?: number
  /** Bytes the client sends after the handshake (e.g. an HTTP request). */
  requestBytes?: number
  /** Bytes the server sends back. */
  responseBytes?: number
}

/** Generates the full TCP connection lifecycle: 3-way handshake, data transfer, 4-way teardown. */
export function tcpSteps(opts: TcpOptions = {}): Step<TcpStepData>[] {
  const { clientIsn = 1000, serverIsn = 5000, requestBytes = 100, responseBytes = 300 } = opts
  let cSeq = clientIsn
  let sSeq = serverIsn
  const steps: Step<TcpStepData>[] = []
  const push = (
    title: string,
    caption: string,
    segment: TcpSegment | null,
    client: TcpState,
    server: TcpState,
    phase: TcpStepData['phase'],
    detail?: string,
  ) => steps.push({ title, caption, detail, data: { segment, client, server, phase } })

  push('Server listens', 'The server opens a socket and waits for connections (passive open).', null, 'CLOSED', 'LISTEN', 'setup',
    'e.g. a web server calls listen() on port 443. The client will pick a random ephemeral source port (49152–65535).')

  // 1. SYN
  push('1. SYN', `Client: "I want to talk. My starting sequence number is ${cSeq}."`,
    { from: 'client', flags: ['SYN'], seq: cSeq, len: 0 }, 'SYN_SENT', 'LISTEN', 'setup',
    'The ISN is random to prevent spoofed/old segments being accepted. SYN consumes one sequence number even with no data. Options like MSS, Window Scale and SACK-permitted are negotiated here.')
  cSeq += 1

  // 2. SYN-ACK
  push('2. SYN-ACK', `Server: "Got it (ack ${cSeq}). My starting sequence number is ${sSeq}."`,
    { from: 'server', flags: ['SYN', 'ACK'], seq: sSeq, ack: cSeq, len: 0 }, 'SYN_SENT', 'SYN_RECEIVED', 'setup',
    'ACK number = the next byte the server expects from the client (client ISN + 1).')
  sSeq += 1

  // 3. ACK
  push('3. ACK', `Client: "Got yours too (ack ${sSeq})." The connection is open.`,
    { from: 'client', flags: ['ACK'], seq: cSeq, ack: sSeq, len: 0 }, 'ESTABLISHED', 'ESTABLISHED', 'setup',
    'After 3 segments both sides know each other\'s ISN and that both directions work. This costs 1 RTT before any data flows.')

  // Data
  push('Send data', `Client sends ${requestBytes} bytes (e.g. an HTTP request).`,
    { from: 'client', flags: ['PSH', 'ACK'], seq: cSeq, ack: sSeq, len: requestBytes }, 'ESTABLISHED', 'ESTABLISHED', 'data',
    `Bytes ${cSeq}–${cSeq + requestBytes - 1}. PSH tells the receiver to hand data to the application immediately.`)
  cSeq += requestBytes

  push('Response', `Server acknowledges the ${requestBytes} bytes (ack ${cSeq}) and sends ${responseBytes} bytes back.`,
    { from: 'server', flags: ['PSH', 'ACK'], seq: sSeq, ack: cSeq, len: responseBytes }, 'ESTABLISHED', 'ESTABLISHED', 'data',
    'Acknowledgements are cumulative: ack N means "I have every byte before N". Lost segments are retransmitted after a timeout or 3 duplicate ACKs.')
  sSeq += responseBytes

  push('ACK data', `Client acknowledges the response (ack ${sSeq}).`,
    { from: 'client', flags: ['ACK'], seq: cSeq, ack: sSeq, len: 0 }, 'ESTABLISHED', 'ESTABLISHED', 'data')

  // Teardown
  push('FIN', 'Client: "I\'m done sending."', { from: 'client', flags: ['FIN', 'ACK'], seq: cSeq, ack: sSeq, len: 0 },
    'FIN_WAIT_1', 'ESTABLISHED', 'teardown', 'Each direction is closed independently (half-close). FIN consumes one sequence number.')
  cSeq += 1

  push('ACK', 'Server: "OK, noted." (It may still have data to send.)', { from: 'server', flags: ['ACK'], seq: sSeq, ack: cSeq, len: 0 },
    'FIN_WAIT_2', 'CLOSE_WAIT', 'teardown')

  push('FIN', 'Server: "I\'m done too."', { from: 'server', flags: ['FIN', 'ACK'], seq: sSeq, ack: cSeq, len: 0 },
    'FIN_WAIT_2', 'LAST_ACK', 'teardown')
  sSeq += 1

  push('Final ACK', 'Client acknowledges. It waits a little (TIME_WAIT) in case the ACK is lost, then closes.',
    { from: 'client', flags: ['ACK'], seq: cSeq, ack: sSeq, len: 0 }, 'TIME_WAIT', 'CLOSED', 'teardown',
    'TIME_WAIT lasts 2×MSL (often 60s on Linux) so late duplicate segments die out and the final ACK can be resent.')

  push('Closed', 'Connection fully closed on both sides.', null, 'CLOSED', 'CLOSED', 'teardown')
  return steps
}

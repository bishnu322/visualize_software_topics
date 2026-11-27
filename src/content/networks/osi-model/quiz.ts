import type { QuizQuestion } from '@/components/shared/lesson/Quiz'

export const quiz: QuizQuestion[] = [
  { q: 'At which OSI layer do routers make forwarding decisions?', options: ['Layer 2: Data Link', 'Layer 3: Network', 'Layer 4: Transport', 'Layer 7: Application'], answer: 1, why: 'Routers read the destination IP address (Layer 3) and forward packets between networks.' },
  { q: 'What is the PDU called at the Transport layer?', options: ['Frame', 'Packet', 'Segment', 'Bits'], answer: 2, why: 'TCP data units are segments (UDP ones are often called datagrams). Packets are Layer 3, frames Layer 2.' },
  { q: 'Which layer adds a trailer (FCS) for error detection?', options: ['Physical', 'Data Link', 'Network', 'Session'], answer: 1, why: 'Ethernet adds a 4-byte Frame Check Sequence (CRC-32) at the end of every frame.' },
  { q: 'In the TCP/IP model, OSI layers 5, 6 and 7 are combined into…', options: ['Transport', 'Internet', 'Application', 'Link'], answer: 2, why: 'The TCP/IP model has 4 layers: Application (OSI 5–7), Transport, Internet, and Link (OSI 1–2).' },
]

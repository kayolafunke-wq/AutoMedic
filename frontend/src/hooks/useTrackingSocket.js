import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

/**
 * Subscribe to live repair progress updates.
 * - customerId → join_customer room (authenticated dashboard)
 * - trackingRef → track_VEHICLE room (public tracking page)
 */
export function useTrackingSocket({ customerId, trackingRef, onUpdate }) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    const socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    })

    if (customerId) socket.emit('join_customer', customerId)
    if (trackingRef) socket.emit('track_vehicle', trackingRef.toUpperCase())

    socket.on('progress_update', (data) => {
      onUpdateRef.current?.(data)
    })

    return () => socket.disconnect()
  }, [customerId, trackingRef])
}

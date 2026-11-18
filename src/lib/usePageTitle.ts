import { useEffect } from 'react'

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Bling Fest` : 'Bling Fest — Canvas Alive · Kampala'
  }, [title])
}

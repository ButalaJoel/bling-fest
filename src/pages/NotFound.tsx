import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import { usePageTitle } from '../lib/usePageTitle'

export default function NotFound() {
  usePageTitle('Page not found')
  return (
    <Container className="py-24 text-center">
      <p className="display poster-word text-[140px]">404</p>
      <p className="mt-4 text-lg">This page isn't on the canvas.</p>
      <Button to="/" variant="ink" className="mt-6">Back to home</Button>
    </Container>
  )
}

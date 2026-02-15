import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

test('Badge renders correctly', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeDefined()
})

test('Badge applies variant class', () => {
    const { container } = render(<Badge variant="destructive">Destructive</Badge>)
    // Check if the rendered element has the class associated with 'destructive' variant
    // In Badge.tsx: destuctive -> bg-destructive
    expect(container.firstChild).toHaveClass('bg-destructive')
})

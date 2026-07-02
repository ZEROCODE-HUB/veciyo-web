import { useState, type ReactNode } from 'react'
import { ChevronDownIcon } from './icons'

interface AccordionSection {
  id: string
  title: string
  content: ReactNode
}

interface AccordionProps {
  sections: AccordionSection[]
}

export default function Accordion({ sections }: AccordionProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-white">
      {sections.map((section) => {
        const isOpen = openSections.has(section.id)
        return (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => toggle(section.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-ink transition-colors hover:bg-surface-soft"
            >
              <span>{section.title}</span>
              <ChevronDownIcon
                className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="border-t border-line px-5 pb-4 pt-3 text-sm leading-relaxed text-ink/70">
                {section.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

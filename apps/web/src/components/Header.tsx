import { Link } from '@tanstack/react-router'
import { Logo } from '@govtech-bb/react'
import { OfficialBanner } from './OfficialBanner'
import { StageBanner } from './StageBanner'

export default function Header() {
  return (
    <div>
      <OfficialBanner />
      <div className="bg-blue-10">
        <div className="container">
          <StageBanner stage="alpha" />
        </div>
      </div>
      <header className="relative bg-yellow-100">
        <div className="container">
          <div className="flex items-center gap-3 py-4 lg:py-6">
            <Link to="/" aria-label="Go to the alpha.gov.bb homepage">
              <Logo aria-hidden="true" className="h-7 w-auto lg:h-9" />
            </Link>
          </div>
        </div>
      </header>
    </div>
  )
}

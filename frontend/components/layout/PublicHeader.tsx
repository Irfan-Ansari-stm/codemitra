'use client';

import { AppHeader } from './AppHeader';

export { AppHeader } from './AppHeader';
export { BrandLogo } from './BrandLogo';
export { DesktopNavigation } from './DesktopNavigation';
export { MobileNavigation } from './MobileNavigation';
export { GlobalSearch } from './GlobalSearch';
export { NotificationCenter } from './NotificationCenter';
export { UserProfileMenu } from './UserProfileMenu';
export { ThemeSwitcher } from './ThemeSwitcher';

export function PublicHeader() {
  return <AppHeader />;
}

export default PublicHeader;

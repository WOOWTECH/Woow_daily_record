# Settings Module Design

## Overview

Expand the Settings functionality with three main sections:
1. **Profile Settings** - User's own profile management
2. **Site Settings** - Household preferences and appearance
3. **Member Access** - Invite users and manage page-level permissions (owner only)

## Settings Page Structure

```
Settings Page (app-level)
├── 👤 Profile Settings
│   └── User's own profile (name, avatar, password)
│
├── 🏠 Site Settings
│   ├── Theme: Light / Dark / System
│   ├── Language: EN / 中文 / 繁體
│   ├── Household Name
│   ├── Timezone
│   └── Units: Metric / Imperial
│
└── 🔐 Member Access (Owner only)
    ├── Invite User (email/link)
    ├── Manage Users list
    └── Per-user page permissions (Close/View/Partial/Edit)
```

**Member Management** remains in Health Page → Settings tab.

---

## Permission Model

### Owner
- Full control of everything
- Only one who can edit auth/permission settings

### User Roles - Page-level access with 4 levels

| Level   | Can View | Can Add Records | Can Add Categories | Can Edit/Delete |
|---------|----------|-----------------|-------------------|-----------------|
| close   | ❌       | ❌              | ❌                | ❌              |
| view    | ✅       | ❌              | ❌                | ❌              |
| partial | ✅       | ✅              | ❌                | ❌              |
| edit    | ✅       | ✅              | ✅                | ✅              |

---

## Database Schema

### 1. Households Table (Site Settings)

```sql
CREATE TABLE public.households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'My Household',
    timezone TEXT DEFAULT 'UTC',
    units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'zh-CN', 'zh-TW')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 2. Household Members Table (User Access)

```sql
CREATE TABLE public.household_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(household_id, user_id)
);
```

### 3. Page Permissions Table (Access Control)

```sql
CREATE TABLE public.page_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_member_id UUID NOT NULL REFERENCES public.household_members(id) ON DELETE CASCADE,
    page TEXT NOT NULL CHECK (page IN ('activity', 'records', 'growth', 'analytics', 'settings')),
    access_level TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('close', 'view', 'partial', 'edit')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(household_member_id, page)
);
```

### 4. Invitations Table (Pending Invites)

```sql
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    default_access_level TEXT DEFAULT 'view' CHECK (default_access_level IN ('view', 'partial', 'edit')),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 5. Helper Function

```sql
CREATE OR REPLACE FUNCTION public.check_page_access(
    p_user_id UUID,
    p_household_id UUID,
    p_page TEXT,
    p_required_level TEXT
) RETURNS BOOLEAN AS $$
-- Returns true if user has required access level for the page
-- Owner always has full access
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Frontend Component Architecture

### File Structure

```
src/modules/settings/
├── components/
│   ├── index.ts
│   ├── settings-page.tsx          # Main settings page with sections
│   ├── settings-nav.tsx           # Section navigation tabs
│   ├── profile-settings.tsx       # User profile form
│   ├── site-settings.tsx          # Household settings form
│   └── member-access/
│       ├── index.ts
│       ├── member-access-section.tsx   # Container (owner only)
│       ├── invite-dialog.tsx           # Send invite modal
│       ├── member-list.tsx             # List of household members
│       ├── member-card.tsx             # Single member with permissions
│       └── permission-selector.tsx     # Page access dropdown
├── store/
│   └── index.ts                   # Zustand store for settings
├── lib/
│   └── actions.ts                 # Server actions
└── types/
    └── index.ts                   # TypeScript interfaces
```

### Settings Page Layout

```tsx
<SettingsPage>
  <SettingsNav activeSection={section} />

  <div className="space-y-6">
    {section === 'profile' && <ProfileSettings />}
    {section === 'site' && <SiteSettings />}
    {section === 'members' && isOwner && <MemberAccessSection />}
  </div>
</SettingsPage>
```

Navigation: Pill tabs - `👤 Profile` | `🏠 Site` | `🔐 Members` (owner only)

---

## Component Designs

### Profile Settings

- Avatar upload (Supabase storage)
- Display name edit
- Email shown (not editable - auth-managed)
- Password change (collapsible section)

### Site Settings

- Household name input
- Theme: SegmentedControl (Light/Dark/System with icons)
- Language: Select dropdown (EN / 简体中文 / 繁體中文)
- Timezone: Searchable select
- Units: SegmentedControl (Metric/Imperial)

### Member Access Section

- Header with "Invite Member" button
- Pending invitations list (with copy link, cancel)
- Active members list with MemberCard

### Member Card

- Avatar, name, email
- Owner badge or remove button
- Page permissions grid (for non-owners):
  - Activity, Records, Growth, Analytics, Settings
  - Each with PermissionSelector dropdown

### Invite Dialog

- Email input
- Default access level (View/Partial/Edit)
- Success state with "Copy Link" option

---

## TypeScript Types

```typescript
// Site Settings
interface Household {
  id: string;
  owner_id: string;
  name: string;
  timezone: string;
  units: 'metric' | 'imperial';
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'zh-CN' | 'zh-TW';
  created_at: string;
  updated_at: string;
}

// Member Access
type AccessLevel = 'close' | 'view' | 'partial' | 'edit';
type PageName = 'activity' | 'records' | 'growth' | 'analytics' | 'settings';
type MemberRole = 'owner' | 'member';

interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  name: string;
  email: string;
  avatar_url: string | null;
  permissions: Record<PageName, AccessLevel>;
}

interface Invitation {
  id: string;
  household_id: string;
  email: string;
  invite_code: string;
  invited_by: string;
  default_access_level: AccessLevel;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

// Profile
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}
```

---

## Zustand Store

```typescript
interface SettingsState {
  // State
  profile: UserProfile | null;
  household: Household | null;
  members: HouseholdMember[];
  invitations: Invitation[];
  isOwner: boolean;

  // Loading states
  isProfileLoading: boolean;
  isHouseholdLoading: boolean;
  isMembersLoading: boolean;
  isInvitationsLoading: boolean;

  // Actions - Profile
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;

  // Actions - Household
  fetchHousehold: () => Promise<void>;
  updateHousehold: (updates: HouseholdUpdate) => Promise<void>;

  // Actions - Members
  fetchMembers: () => Promise<void>;
  updateMemberPermission: (memberId, page, level) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;

  // Actions - Invitations
  fetchInvitations: () => Promise<void>;
  createInvitation: (invite: NewInvitation) => Promise<Invitation>;
  cancelInvitation: (inviteId: string) => Promise<void>;
}
```

**Key patterns:**
- Optimistic updates with rollback on error
- Separate loading states per section
- Computed `isOwner` for permission checks

---

## Translation Keys Required

```json
{
  "settings": {
    "title": "Settings",
    "profile": {
      "title": "Profile",
      "displayName": "Display Name",
      "email": "Email",
      "changePhoto": "Change Photo",
      "changePassword": "Change Password",
      "currentPassword": "Current Password",
      "newPassword": "New Password",
      "confirmPassword": "Confirm Password"
    },
    "site": {
      "title": "Site Settings",
      "subtitle": "Customize your household preferences",
      "householdName": "Household Name",
      "theme": "Theme",
      "themeLight": "Light",
      "themeDark": "Dark",
      "themeSystem": "System",
      "language": "Language",
      "timezone": "Timezone",
      "units": "Measurement Units",
      "unitsMetric": "Metric (kg, cm)",
      "unitsImperial": "Imperial (lb, in)"
    },
    "members": {
      "title": "Member Access",
      "subtitle": "Manage who can access your household",
      "inviteMember": "Invite Member",
      "pendingInvitations": "Pending Invitations",
      "activeMembers": "Members",
      "copyLink": "Copy Link",
      "expires": "Expires",
      "owner": "Owner",
      "pageAccess": "Page Access",
      "accessClose": "Close",
      "accessView": "View",
      "accessPartial": "Partial",
      "accessEdit": "Edit",
      "inviteDialog": {
        "title": "Invite Member",
        "subtitle": "Send an invitation to join your household",
        "email": "Email Address",
        "defaultAccess": "Default Access Level",
        "defaultAccessHint": "Applied to all pages initially",
        "sendInvite": "Send Invite",
        "inviteSent": "Invitation sent to",
        "done": "Done"
      },
      "remove": "Remove Member",
      "removeConfirm": "Are you sure you want to remove this member?"
    }
  }
}
```

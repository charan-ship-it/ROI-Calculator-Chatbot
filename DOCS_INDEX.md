# 📚 Documentation Index - ROI Chatbot

## Quick Navigation

### 🚀 Getting Started
- **[README.md](./README.md)** - Project overview and quick start guide
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Detailed setup instructions
- **[VERCEL_SETUP.md](./VERCEL_SETUP.md)** - Vercel deployment guide

### 🏗️ Architecture & Codebase
- **[CODEBASE_OVERVIEW.md](./CODEBASE_OVERVIEW.md)** - Complete system architecture and components
  - Authentication system
  - Chat API and data flow
  - Database schema and queries
  - n8n integration
  - **NEW: Auto-scroll behavior (Section 13)**

### 🎯 Feature Documentation
- **[SCROLL_BEHAVIOR.md](./SCROLL_BEHAVIOR.md)** - ⭐ Auto-scroll feature comprehensive guide
  - Feature overview and implementation
  - Behavior rules and conditions
  - Technical details and architecture
  - Testing scenarios
  - Troubleshooting guide
  
- **[SCROLL_FLOW_DIAGRAM.md](./SCROLL_FLOW_DIAGRAM.md)** - Visual documentation
  - Component architecture diagrams
  - State flow diagrams
  - Decision trees
  - Timeline views

### 🔧 Implementation Details
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Implementation changelog
  - What changed and why
  - Verification checklist
  - Testing recommendations
  - Rollback plan

### 🐛 Troubleshooting
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

---

## Recent Updates (January 10, 2025)

### ✨ Auto-Scroll Feature

**What's New**:
- Auto-scroll now works during both AI thinking and responding phases
- Full user control preserved when manually scrolling
- Comprehensive documentation added

**Files Changed**:
- ✅ `hooks/use-messages.tsx` (1 code change)
- ✅ `CODEBASE_OVERVIEW.md` (documentation update)
- ✅ `README.md` (quick reference added)

**New Documentation**:
- 📄 `SCROLL_BEHAVIOR.md` (204 lines)
- 📄 `SCROLL_FLOW_DIAGRAM.md` (336 lines)
- 📄 `IMPLEMENTATION_SUMMARY.md` (211 lines)
- 📄 `DOCS_INDEX.md` (this file)

---

## Documentation by Purpose

### I want to...

**Understand the project**
→ Start with [README.md](./README.md)
→ Then read [CODEBASE_OVERVIEW.md](./CODEBASE_OVERVIEW.md)

**Set up the project**
→ Follow [GETTING_STARTED.md](./GETTING_STARTED.md)
→ Check [VERCEL_SETUP.md](./VERCEL_SETUP.md) for deployment

**Understand auto-scroll feature**
→ Read [SCROLL_BEHAVIOR.md](./SCROLL_BEHAVIOR.md)
→ View diagrams in [SCROLL_FLOW_DIAGRAM.md](./SCROLL_FLOW_DIAGRAM.md)

**See what changed recently**
→ Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

**Fix an issue**
→ Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
→ Review relevant feature documentation

**Contribute to the project**
→ Read [CODEBASE_OVERVIEW.md](./CODEBASE_OVERVIEW.md)
→ Review implementation docs for code standards

---

## File Organization

```
ai-chatbot/
├── README.md                     # Main project overview
├── DOCS_INDEX.md                 # This file - documentation navigator
├── GETTING_STARTED.md            # Setup guide
├── CODEBASE_OVERVIEW.md          # Architecture documentation
├── VERCEL_SETUP.md              # Deployment guide
├── TROUBLESHOOTING.md           # Problem solving
├── 
├── Feature Documentation:
│   ├── SCROLL_BEHAVIOR.md       # Auto-scroll comprehensive guide
│   ├── SCROLL_FLOW_DIAGRAM.md   # Visual diagrams
│   └── IMPLEMENTATION_SUMMARY.md # Change details
│
└── Source Code:
    ├── app/                      # Next.js pages
    ├── components/               # React components
    ├── hooks/                    # Custom React hooks
    └── lib/                      # Utilities and database
```

---

## Key Sections by Topic

### Authentication & Security
- [CODEBASE_OVERVIEW.md - Section 1](./CODEBASE_OVERVIEW.md#1-authentication-system-appauth)
- [GETTING_STARTED.md - Environment Variables](./GETTING_STARTED.md)

### Chat & Messaging
- [CODEBASE_OVERVIEW.md - Section 2 & 3](./CODEBASE_OVERVIEW.md#2-chat-api-appchatapichatroutets)
- [SCROLL_BEHAVIOR.md](./SCROLL_BEHAVIOR.md)

### Database
- [CODEBASE_OVERVIEW.md - Section 4 & 5](./CODEBASE_OVERVIEW.md#4-database-schema-libdbschemats)

### n8n Integration
- [CODEBASE_OVERVIEW.md - Section 7](./CODEBASE_OVERVIEW.md#7-n8n-integration)

### UI/UX Features
- [SCROLL_BEHAVIOR.md](./SCROLL_BEHAVIOR.md) - Auto-scroll
- [CODEBASE_OVERVIEW.md - Section 13](./CODEBASE_OVERVIEW.md#13-auto-scroll-behavior)

---

## Quick Links

| Need | Document | Section |
|------|----------|---------|
| Quick start | [README.md](./README.md) | Quick Start |
| Environment setup | [GETTING_STARTED.md](./GETTING_STARTED.md) | Prerequisites |
| API documentation | [CODEBASE_OVERVIEW.md](./CODEBASE_OVERVIEW.md) | Section 2 |
| Database schema | [CODEBASE_OVERVIEW.md](./CODEBASE_OVERVIEW.md) | Section 4 |
| Auto-scroll guide | [SCROLL_BEHAVIOR.md](./SCROLL_BEHAVIOR.md) | Full doc |
| Visual diagrams | [SCROLL_FLOW_DIAGRAM.md](./SCROLL_FLOW_DIAGRAM.md) | Full doc |
| Recent changes | [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | Full doc |
| Troubleshooting | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Full doc |

---

## Contributing to Documentation

When adding new features:

1. **Update existing docs**:
   - Add to [CODEBASE_OVERVIEW.md](./CODEBASE_OVERVIEW.md) as a new section
   - Update [README.md](./README.md) if it's a major feature

2. **Create feature docs**:
   - Create `FEATURE_NAME_BEHAVIOR.md` for comprehensive guide
   - Create `FEATURE_NAME_FLOW_DIAGRAM.md` for visuals
   - Create `FEATURE_NAME_SUMMARY.md` for implementation details

3. **Update this index**:
   - Add links in relevant sections
   - Update "Recent Updates" section
   - Add to quick links table

---

## Documentation Standards

### File Naming
- Use UPPERCASE with underscores: `FEATURE_NAME.md`
- Be descriptive: `SCROLL_BEHAVIOR.md` not `SCROLL.md`
- Use consistent suffixes:
  - `_BEHAVIOR.md` - User-facing feature documentation
  - `_FLOW_DIAGRAM.md` - Visual diagrams and flows
  - `_SUMMARY.md` - Implementation details and changes

### Content Structure
- Start with overview/summary
- Include table of contents for long docs
- Use clear section headers
- Provide code examples
- Include troubleshooting section
- Add "Related Files" or "See Also" section

### Code Documentation
- Document WHY, not just WHAT
- Include examples
- Note edge cases
- Link to related documentation

---

## Maintenance

This index should be updated when:
- ✅ New documentation files are added
- ✅ Major features are implemented
- ✅ Documentation structure changes
- ✅ Sections are reorganized

---

**Last Updated**: January 10, 2025  
**Next Review**: When new features are added

---

## Quick Search Tips

Use your editor's search (Ctrl/Cmd+F) to find:
- "Authentication" → Auth-related docs
- "Database" → DB schema and queries
- "API" → API documentation
- "n8n" → Integration docs
- "Scroll" → Auto-scroll feature docs
- "Error" → Error handling and troubleshooting

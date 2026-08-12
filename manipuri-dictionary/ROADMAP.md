# Manipuri Dictionary — Feature Roadmap

Current status of the dictionary web app and planned improvements.

## ✅ Already Implemented
- Search (debounced, suggestions, keyboard navigation, exact/prefix/partial ranking)
- Word pages (definitions, parts of speech, synonyms/antonyms, related words, feedback)
- Text-to-speech (Web Speech API "Listen" button)
- Bookmarks, Profile, Settings (name/email/password)
- Forgot / Reset password (single-use 60-min tokens)
- Contributions (new word + edit suggestions), My Contributions dashboard
- Roles & Admin: dashboard, moderation queue, user management, audit trail
- Meitei Mayek editor + on-screen keyboard + live converter preview
- Homepage with Popular Words + Recently Added + meaning previews
- Mobile navigation drawer, dark mode, SEO (metadata/sitemap/robots)

## 🔍 Search & Discovery
- [ ] Browse A–Z pages (`/browse/a` … `/browse/z`) with first-letter counts
- [ ] Filter search by part of speech (`/search?q=...&pos=noun`)
- [ ] Meitei Mayek script search (type ꯅꯥꯄꯤ directly)
- [ ] Typo-tolerant / fuzzy matching
- [ ] Word of the Day widget (`word_of_day` table already exists)
- [ ] Random word button
- [ ] Recent searches (per user)

## 📖 Content Richness
- [ ] Example sentences per sense
- [ ] Real pronunciation audio + IPA (beyond TTS)
- [ ] Etymology / word origin
- [ ] Idioms & Proverbs section (`proverbs` table exists, no UI yet)
- [ ] Usage notes / frequency labels
- [ ] Clickable synonym graph (navigate related senses)
- [ ] Dialectal / regional variations

## 🎓 Learning & Engagement
- [ ] Flashcards / spaced repetition per user
- [ ] My word lists (group bookmarks into themed lists)
- [ ] Quiz / practice mode
- [ ] Learner streak & progress tracking
- [ ] Daily word email / push notification
- [ ] Share cards (OG image per word)
- [ ] Print / export entry as PDF

## 🈯 Meitei Mayek–Specific
- [ ] Learn the script page (alphabet + sounds)
- [ ] Latin ↔ Mayek display toggle on entries
- [ ] Standalone text converter tool page (ASCII → Meitei Mayek)
- [ ] Mayek glyph reference (font mapping already exists in `src/lib/meitei-mayek`)

## 🛠 Platform & Technical
- [ ] Public REST API for third-party apps
- [ ] PWA / offline mode
- [ ] UI language toggle (English / Manipuri)
- [ ] RSS / sitemap push for new words
- [ ] Contribution status email notifications
- [ ] Rate-limited public API + response caching
- [ ] OAuth social login (Google / Facebook placeholders exist in schema)

## 🗄 Admin / Data Quality
- [ ] Bulk edit / translate tool (to address the ~93% of senses lacking Manipuri content)
- [ ] Merge duplicate words
- [ ] Translation coverage report dashboard (audit logic exists in `audit_data_gaps.js`)
- [ ] Data quality flagging & review queue
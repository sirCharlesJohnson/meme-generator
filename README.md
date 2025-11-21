# Meme Share - Full Stack Meme Sharing App

A modern full-stack application for sharing and voting on memes, built with Next.js, InstantDB, and Cloudinary.

## Features

- User authentication with magic link (email-based)
- Upload and share memes with titles
- Upvote/downvote memes
- Real-time updates
- Responsive design
- Sorted feed by popularity and recency

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database & Auth**: InstantDB
- **Image Storage**: Cloudinary
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Setup Instructions

### 1. Install Dependencies

The dependencies are already installed, but if you need to reinstall:

```bash
npm install
```

### 2. Set Up Cloudinary

1. Go to [Cloudinary](https://cloudinary.com/) and create a free account
2. Get your credentials from the Cloudinary dashboard
3. Create a `.env.local` file in the root directory:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Configure InstantDB Schema

1. Go to [InstantDB Dashboard](https://instantdb.com/dash)
2. Select your app (ID: `adbe79f3-ad7d-4af9-aeae-00f2e5dae65b`)
3. Go to the Schema tab
4. Add the following entities:

**memes** entity:
- `id` (string)
- `title` (string)
- `imageUrl` (string)
- `userId` (string)
- `userEmail` (string)
- `createdAt` (number)

**upvotes** entity:
- `id` (string)
- `memeId` (string)
- `userId` (string)

5. (Optional) Add a unique constraint on `upvotes` for `(memeId, userId)` to prevent duplicate upvotes

### 4. Enable Authentication

1. In the InstantDB Dashboard, go to the Auth tab
2. Enable Email/Magic Link authentication
3. Configure the email templates if desired

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### First Time Setup

1. Open the app in your browser
2. Sign in with your email address
3. Check your email for the magic link
4. Click the link to authenticate

### Posting a Meme

1. Click "Post a Meme" button
2. Enter a title for your meme
3. Select an image file
4. Preview your meme
5. Click "Post Meme" to upload

### Voting

- Click the upvote button on any meme to vote
- Click again to remove your vote
- Memes are sorted by upvote count and recency

## Project Structure

```
cursor_video/
├── app/
│   ├── api/
│   │   └── upload/
│   │       └── route.ts          # Cloudinary upload API
│   ├── create/
│   │   └── page.tsx              # Meme creation form
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main feed page
├── components/
│   ├── AuthProvider.tsx          # Authentication wrapper
│   └── MemeCard.tsx              # Meme card component
├── lib/
│   └── instant.ts                # InstantDB client config
├── next.config.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Key Features Implemented

### Authentication
- Magic link email authentication
- Automatic sign-in/sign-out
- Protected routes
- User session management

### Meme Management
- Image upload with preview
- Title and metadata
- Real-time feed updates
- Sorted by popularity

### Voting System
- One vote per user per meme
- Toggle upvotes on/off
- Real-time vote counts
- Optimistic UI updates

### User Experience
- Loading states
- Error handling
- Empty states
- Responsive design
- Clean, minimalist UI

## Environment Variables

Create a `.env.local` file with:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add your environment variables in the Vercel dashboard
4. Deploy

The InstantDB app is already configured and will work in production automatically.

## Troubleshooting

### Images not uploading
- Check your Cloudinary credentials in `.env.local`
- Ensure file size is under Cloudinary's free tier limits (10MB)

### Authentication not working
- Verify your email in InstantDB dashboard
- Check that magic link authentication is enabled
- Look for emails in spam folder

### Memes not showing
- Check browser console for errors
- Verify InstantDB schema is set up correctly
- Ensure you're authenticated

## Future Enhancements

Potential features to add:
- Comments on memes
- User profiles
- Categories/tags
- Search functionality
- Infinite scroll pagination
- Share to social media
- Report/moderation system

## License

MIT




# meme-generator

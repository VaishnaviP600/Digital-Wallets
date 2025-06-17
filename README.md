# Digital Wallets - Secure Password & File Storage

A secure application for storing encrypted passwords and files with sharing capabilities.

## Prerequisites

- Node.js v18 or later
- npm v9 or later
- A Supabase account and project (for database and authentication)

## Setup Instructions

1. Clone or download the project files to your local machine

2. Open the project in VS Code:
   ```bash
   code crypto-wallet
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a Supabase Project:
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Copy your project URL and anon key
   - Create a `.env` file in the project root:
     ```
     VITE_SUPABASE_URL=your_project_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```

5. Set up the database:
   - Go to your Supabase project's SQL editor
   - Run the SQL commands from `src/lib/database.types.ts`
   - Run the SQL commands from `setup.sql`
   - Run the SQL commands from `update-schema.sql`

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## Features

- 🔐 Secure password storage with encryption
- 📁 Encrypted file storage
- 🔄 File sharing between users
- 🎨 Modern UI with animations
- 🔒 End-to-end encryption
- 👥 User authentication
- 📱 Responsive design

## Security Features

- Client-side encryption/decryption
- Secure key management
- Zero-knowledge architecture
- Encrypted file sharing

## Development

To run the project in development mode:

```bash
npm run dev
```

To build for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the project root with these variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

The application requires several database tables and policies. Run the SQL setup scripts in this order:

1. `src/lib/database.types.ts` (contains table creation)
2. `setup.sql` (sets up file sharing)
3. `update-schema.sql` (updates schemas and policies)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT License

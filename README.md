# Resume Analyser Ai - Innovative Approach to Job Application Processing

## Project Overview & Approach

Resume Analyser Ai represents a novel solution to the challenges in modern job application processes. Our approach focuses on leveraging cutting-edge AI technologies to create a more efficient and accurate Resume Analyser Aiing system.

## Documentation

For detailed documentation about the Resume Analyser AI platform's features, architecture, and implementation details, please visit our [comprehensive documentation](https://balsam-colony-46f.notion.site/Documentation-for-AI-Powered-Job-Application-Platform-1808b6ffb8488019be7cc864d0a2dc5d?pvs=73).

## Contact Information

### Project Lead

- **Name:** Shiv Awasthi
- **Email:** awasthishiv0987@gmail.com
- **Phone:** +91 8791346998

### Project Details

- **Organization:** Tata Group (Internship)
- **Demo:** [Resume Analyser AI Platform](https://resumeanalyserai.vercel.app/)

### Key Technical Features

- **Parallel Resume Processing**: Utilizes Web Workers for efficient parallel processing of multiple resumes
- **Batch Processing System**: Implements intelligent batching with retry mechanisms for reliable processing
- **Real-time Analysis**: Leverages OpenAI's GPT models for instant resume parsing and job matching
- **Secure File Handling**: Uses Supabase storage for secure resume file management
- **Scalable Architecture**: Built with React, TypeScript, and Supabase for enterprise-grade scalability

### System Architecture

The platform employs a modern tech stack with:

- Frontend: React with TypeScript for type-safe development
- Backend: Supabase Edge Functions for serverless processing
- Storage: Supabase Storage for secure file management
- AI Integration: OpenAI GPT models for intelligent analysis
- Worker System: Web Workers for parallel processing capabilities

## Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/Resume Analyser Ai.git
   cd Resume Analyser Ai
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your API keys and configuration

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:8080 in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Environment Variables

Required environment variables:

- `OPENAI_API_KEY` - Your OpenAI API key for gpt-4o access
- `UNSTRUCTURED_API_KEY` - API key for document processing
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for Supabase authentication

## Innovative Features

1. **Real-time Resume Scoring**

   - Instant feedback on application strength
   - Detailed breakdown of matching criteria
   - Suggestions for improvement

2. **Mass Application Processing**

   - Batch processing of multiple resumes
   - Parallel AI analysis
   - Progress tracking and error handling

3. **Intelligent Job Analysis**
   - Automatic extraction of key requirements
   - Standardized evaluation criteria
   - Consistent scoring metrics

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

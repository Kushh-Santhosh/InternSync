import fs from 'fs';
import path from 'path';
import { parsePdfDetailed } from '../src/lib/documents/pdf-parser';

function createRealPdfResume(): Buffer {
  // Page 1 lines: Profile, Education, Skills, Work Experience
  const page1Lines = [
    'BT /F1 18 Tf 50 740 Td (RAHUL SHARMA) Tj ET',
    'BT /F1 10 Tf 50 722 Td (New Delhi, India | rahul.sharma.dev2026@gmail.com | github.com/rahul-sharma) Tj ET',
    'BT /F1 13 Tf 50 690 Td (EDUCATION) Tj ET',
    'BT /F1 11 Tf 50 672 Td (Delhi Technological University - B.Tech in Computer Science and Engineering) Tj ET',
    'BT /F1 10 Tf 50 656 Td (Current Year: 3rd Year | Graduation Year: 2026 | CGPA: 8.8 / 10.0) Tj ET',
    'BT /F1 13 Tf 50 624 Td (CORE SKILLS & TECHNOLOGIES) Tj ET',
    'BT /F1 10 Tf 50 606 Td (Languages: TypeScript, JavaScript, Python, SQL, C++) Tj ET',
    'BT /F1 10 Tf 50 590 Td (Frontend: React, Next.js, Tailwind CSS, Redux Toolkit, HTML5, CSS3) Tj ET',
    'BT /F1 10 Tf 50 574 Td (Backend: Node.js, Express, FastAPI, PostgreSQL, Supabase, REST APIs) Tj ET',
    'BT /F1 10 Tf 50 558 Td (Tools & Systems: Docker, Git, Linux, GitHub Actions, Vitest, Playwright) Tj ET',
    'BT /F1 13 Tf 50 526 Td (PROFESSIONAL WORK EXPERIENCE) Tj ET',
    'BT /F1 11 Tf 50 508 Td (Software Engineering Intern - TechNova Solutions, Bangalore) Tj ET',
    'BT /F1 10 Tf 50 492 Td (Duration: May 2025 - July 2025) Tj ET',
    'BT /F1 10 Tf 50 476 Td (Implemented responsive client-side telemetry dashboards in React and TypeScript.) Tj ET',
    'BT /F1 10 Tf 50 460 Td (Optimized SQL queries on PostgreSQL backend reducing endpoint latency by 32 percent.) Tj ET',
  ];

  // Page 2 lines: Projects, Evidence, Certifications
  const page2Lines = [
    'BT /F1 18 Tf 50 740 Td (RAHUL SHARMA - PROJECTS & EVIDENCE) Tj ET',
    'BT /F1 13 Tf 50 700 Td (KEY TECHNICAL PROJECTS) Tj ET',
    'BT /F1 11 Tf 50 680 Td (1. InternSync - Opportunity Readiness Platform) Tj ET',
    'BT /F1 10 Tf 50 664 Td (Full-stack AI readiness system matching students to verified opportunities.) Tj ET',
    'BT /F1 10 Tf 50 648 Td (Built with React 19, TypeScript, PostgreSQL, and Google Gemini SDK.) Tj ET',
    'BT /F1 10 Tf 50 632 Td (Engineered deterministic weighted compatibility engine and resume analysis pipeline.) Tj ET',
    'BT /F1 11 Tf 50 598 Td (2. NeuroVision Real-time Image Classifier) Tj ET',
    'BT /F1 10 Tf 50 582 Td (High-throughput inference microservice using Python, FastAPI, and Docker.) Tj ET',
    'BT /F1 10 Tf 50 566 Td (Containerized with multi-stage Docker builds and automated CI testing.) Tj ET',
    'BT /F1 13 Tf 50 530 Td (CERTIFICATIONS & ACHIEVEMENTS) Tj ET',
    'BT /F1 10 Tf 50 512 Td (AWS Certified Cloud Practitioner - Issued 2025) Tj ET',
    'BT /F1 10 Tf 50 496 Td (Finalist in National AI Hackathon 2025 for student readiness intelligence.) Tj ET',
  ];

  const stream1 = page1Lines.join('\n');
  const stream2 = page2Lines.join('\n');

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 7 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>
endobj
5 0 obj
<< /Length ${Buffer.byteLength(stream1)} >>
stream
${stream1}
endstream
endobj
6 0 obj
<< /Length ${Buffer.byteLength(stream2)} >>
stream
${stream2}
endstream
endobj
7 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 8
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000120 00000 n 
0000000244 00000 n 
0000000368 00000 n 
0000000450 00000 n 
0000000532 00000 n 
trailer
<< /Size 8 /Root 1 0 R >>
startxref
618
%%EOF`;

  return Buffer.from(pdf, 'utf-8');
}

async function main() {
  const fixturesDir = path.resolve(process.cwd(), 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  const pdfBuffer = createRealPdfResume();
  const targetPath = path.join(fixturesDir, 'rahul_sharma_real_resume.pdf');
  fs.writeFileSync(targetPath, pdfBuffer);
  console.log(`✓ Real resume PDF generated at: ${targetPath} (${pdfBuffer.length} bytes)`);

  // Verify extraction with parsePdfDetailed
  const parsed = await parsePdfDetailed(pdfBuffer.buffer);
  console.log('--- Verification of Extracted PDF Pages ---');
  console.log(`Total Pages: ${parsed.totalPages}`);
  console.log(`Is Scanned: ${parsed.isScanned}`);
  console.log(`Is Empty: ${parsed.isEmpty}`);
  console.log(`Text Length: ${parsed.text.length} characters`);
  console.log('\nPreview of Page 1:\n', parsed.pageTexts[0]?.slice(0, 180));
  console.log('\nPreview of Page 2:\n', parsed.pageTexts[1]?.slice(0, 180));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

import PDFDocument from "pdfkit";
import { getDashboard } from "../analytics/analytics.service";

export async function buildQuizReportPdf(quizVersionId: string, facultyId: string) {
  const dashboard = await getDashboard(quizVersionId, facultyId, 10);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(24).text("Quiz Report", { underline: true });
    doc.moveDown();
    doc.fontSize(14).text(`Attempts: ${dashboard.overview.attemptsCount}`);
    doc.text(`Average score: ${dashboard.overview.averageScore.toFixed(2)}`);
    doc.text(`Highest score: ${dashboard.overview.highestScore.toFixed(2)}`);
    doc.text(`Lowest score: ${dashboard.overview.lowestScore.toFixed(2)}`);
    doc.text(`Average percentage: ${dashboard.overview.averagePercentage.toFixed(2)}%`);

    doc.moveDown().fontSize(18).text("Leaderboard");
    dashboard.leaderboard.forEach((entry, index) => {
      doc
        .fontSize(12)
        .text(
          `${index + 1}. ${entry.studentName} - ${entry.score.toFixed(2)} (${entry.percentage.toFixed(2)}%)`,
        );
    });

    doc.moveDown().fontSize(18).text("Question Accuracy");
    dashboard.questionAccuracy.forEach((question, index) => {
      doc
        .fontSize(11)
        .text(
          `${index + 1}. ${question.prompt} | Accuracy ${question.accuracyRate.toFixed(2)}% | Correct ${question.correctCount} | Wrong ${question.wrongCount}`,
        );
    });

    doc.end();
  });
}


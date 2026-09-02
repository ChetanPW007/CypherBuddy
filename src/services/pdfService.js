import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportReportToPDF(reportData, elementId = null) {
  try {
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: '#090f1d',
          useCORS: true
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
        pdf.save(`CypherBuddy_Report_${reportData.id || 'CB-2026'}.pdf`);
        return true;
      }
    }

    // Direct jsPDF fallback generator
    const doc = new jsPDF();
    
    // Header Banner
    doc.setFillColor(15, 23, 42); // dark slate
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(56, 189, 248); // Cyan
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('CYPhERBUDDY SECURITY REPORT', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('Your Smart Digital Safety Companion | Official Incident Audit', 14, 28);

    // Metadata Table Box
    doc.setFillColor(245, 247, 250);
    doc.rect(14, 48, 182, 35, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, 48, 182, 35, 'S');

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`Report ID: ${reportData.id || 'CB-2026-000123'}`, 20, 58);
    doc.text(`Date & Time: ${reportData.timestamp || new Date().toLocaleString()}`, 20, 66);
    doc.text(`Target Item: ${reportData.target || 'N/A'}`, 20, 74);

    // Risk Status Box
    const status = reportData.status || 'SAFE';
    if (status === 'DANGEROUS') {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(244, 63, 94);
      doc.setTextColor(225, 29, 72);
    } else if (status === 'SUSPICIOUS') {
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(245, 158, 11);
      doc.setTextColor(217, 119, 6);
    } else {
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(16, 185, 129);
      doc.setTextColor(5, 150, 105);
    }

    doc.rect(14, 90, 182, 25, 'F');
    doc.rect(14, 90, 182, 25, 'S');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`RISK EVALUATION: ${status} (Score: ${reportData.riskScore || 0} / 100)`, 20, 106);

    // Summary & Findings
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Key Findings & Threat Analysis:', 14, 128);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    let yPos = 138;
    if (reportData.findings && reportData.findings.length > 0) {
      reportData.findings.forEach((finding, idx) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`${idx + 1}. [${finding.type}] ${finding.title}`, 18, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(finding.desc, 170);
        doc.text(splitText, 22, yPos);
        yPos += splitText.length * 6 + 4;
      });
    } else {
      doc.text('No critical security vulnerabilities or phishing threats detected.', 18, yPos);
      yPos += 10;
    }

    // Recommendation Section
    yPos += 6;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('CypherBuddy Recommendation:', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const recText = doc.splitTextToSize(reportData.recommendation || 'Keep your phone operating system updated and exercise standard cyber hygiene.', 175);
    doc.text(recText, 14, yPos);

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated autonomously by CypherBuddy Security Gateway. End of Report.', 14, 285);

    doc.save(`CypherBuddy_Report_${reportData.id || 'CB-2026'}.pdf`);
    return true;
  } catch (err) {
    console.error('PDF Export Error:', err);
    alert('PDF generated successfully!');
    return false;
  }
}

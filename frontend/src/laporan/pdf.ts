import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Pengisian } from "../types";
import { PendahuluanSection } from "./data";

export interface LaporanOptions {
  entries: Pengisian[];
  photos: (string | null)[];
  kopImage: string;
  title: string;
  fileName: string;
  pendahuluan: PendahuluanSection[];
  bulanLaporan: string;
  tglPenutup: string;
  namaPenandatangan: string;
  nipPenandatangan: string;
}

export function generateLaporanPdf(opts: LaporanOptions): jsPDF {
  const {
    entries,
    photos,
    kopImage,
    title,
    pendahuluan,
    bulanLaporan,
    tglPenutup,
    namaPenandatangan,
    nipPenandatangan,
  } = opts;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PAGE_W = 210;
  const PAGE_H = 297;
  const ML = 20;
  const MR = 20;
  const CW = PAGE_W - ML - MR;
  let y = 25;
  const lineH = (pt: number) => Math.max(3, pt * 0.36);
  const newPortraitPage = () => {
    doc.addPage("a4", "portrait");
    y = 25;
  };

  const drawKop = () => {
    const imgProps = doc.getImageProperties(kopImage);
    const imgW = CW;
    const imgH = (imgProps.height * imgW) / imgProps.width;
    doc.addImage(kopImage, "JPEG", ML, y, imgW, imgH);
    y += imgH + 4;
    doc.setLineWidth(0.7);
    doc.line(ML, y, PAGE_W - MR, y);
    doc.setLineWidth(0.2);
    doc.line(ML, y + 1.2, PAGE_W - MR, y + 1.2);
    y += 8;
  };

  const drawTitle = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.splitTextToSize(title, CW - 30).forEach((l: string) => {
      doc.text(l, PAGE_W / 2, y, { align: "center" });
      y += 4.5;
    });
    doc.setFontSize(11);
    doc.text(bulanLaporan, PAGE_W / 2, y, { align: "center" });
    y += 8;
  };

  const writeHeading = (text: string) => {
    if (y > PAGE_H - 28) newPortraitPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(text, ML, y);
    y += 5;
  };

  const writeBab = (text: string, babBaru: boolean) => {
    if (babBaru || y > PAGE_H - 28) newPortraitPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(text, PAGE_W / 2, y, { align: "center" });
    y += 7;
  };

  const writeTable = (t: { header: string[]; rows: string[][] }) => {
    autoTable(doc, {
      startY: y,
      theme: "grid",
      head: [t.header],
      body: t.rows,
      styles: {
        fontSize: 9,
        cellPadding: 2.5,
        valign: "middle",
        lineColor: [0, 0, 0],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        lineColor: [0, 0, 0],
        lineWidth: 0.15,
      },
      margin: { left: ML, right: MR },
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 4;
  };

  const writeParagraph = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.splitTextToSize(text, CW).forEach((l: string) => {
      if (y > PAGE_H - 28) newPortraitPage();
      doc.text(l, ML, y, { maxWidth: CW });
      y += lineH(11);
    });
    y += 2.5;
  };

  const writeList = (items: string[]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    items.forEach((item, idx) => {
      const indent = ML + 15;
      doc.text(`${idx + 1}.`, ML + 8, y, { maxWidth: 7 });
      doc.splitTextToSize(item, CW - 15).forEach((l: string) => {
        if (y > PAGE_H - 28) newPortraitPage();
        doc.text(l, indent, y, { maxWidth: CW - 15 });
        y += lineH(11);
      });
      y += 1.5;
    });
    y += 2;
  };

  const drawSignature = () => {
    if (y > PAGE_H - 80) newPortraitPage();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Bekasi, ${tglPenutup}`, PAGE_W - MR, y, { align: "right" });
    y += 5;
    doc.text("Wali Asrama,", PAGE_W - MR, y, { align: "right" });
    y += 22;
    doc.setFont("helvetica", "bold");
    doc.text(namaPenandatangan, PAGE_W - MR, y, { align: "right" });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(`NIP. ${nipPenandatangan}`, PAGE_W - MR, y, { align: "right" });
  };

  drawKop();
  drawTitle();
  let babTerkini = "";
  let babPertama = true;
  pendahuluan.forEach((sec) => {
    if (sec.bab && sec.bab !== babTerkini) {
      const babBaru = !!sec.babBaru && !babPertama;
      writeBab(sec.bab, babBaru);
      babTerkini = sec.bab;
      babPertama = false;
    }
    if (sec.judul) writeHeading(sec.judul);
    if (sec.paragraf) sec.paragraf.forEach(writeParagraph);
    if (sec.daftar) writeList(sec.daftar);
    if (sec.tabel) writeTable(sec.tabel);
    if (sec.paragrafSetelah) sec.paragrafSetelah.forEach(writeParagraph);
  });
  drawSignature();

  doc.addPage("a4", "landscape");
  const LAND_W = 297;
  const LM = 14;
  const LR = 14;
  y = 25;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("LAMPIRAN KEGIATAN", LAND_W / 2, y, { align: "center" });
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [
      [
        "No",
        "Tanggal",
        "RHK",
        "Aktivitas / Kegiatan",
        "Hasil Tindak Lanjut",
        "Foto",
      ],
    ],
    body: entries.map((r, i) => [
      i + 1,
      r.tanggal_kegiatan,
      r.pilih_rhk_text || "-",
      r.aktivitas_kegiatan || "-",
      r.hasil_tl || "-",
      r.url_foto ? " " : "-",
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 3,
      valign: "middle",
      lineColor: [0, 0, 0],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      lineColor: [0, 0, 0],
      lineWidth: 0.15,
    },
    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: 25 },
      2: { cellWidth: 18 },
      3: { cellWidth: 50 },
      4: { cellWidth: 60 },
      5: { cellWidth: 85 },
    },
    margin: { top: y, left: LM, right: LR, bottom: 20 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        // 50mm ≈ 3 baris foto per halaman A4 landscape
        // (tinggi halaman 210mm - margin atas 25 - bawah 20 - header ±15) : 3
        data.cell.styles.minCellHeight = 50;
      }
    },
    didDrawCell: (data) => {
      if (data.section !== "body" || data.column.index !== 5) return;
      const photo = photos[data.table.body.indexOf(data.row)];
      if (!photo) return;
      try {
        const cell = data.cell;
        const boxW = cell.width - 4;
        const boxH = cell.height - 4;
        const props = doc.getImageProperties(photo);
        const scale = Math.min(boxW / props.width, boxH / props.height);
        doc.addImage(
          photo,
          "JPEG",
          cell.x + 2 + (boxW - props.width * scale) / 2,
          cell.y + 2 + (boxH - props.height * scale) / 2,
          props.width * scale,
          props.height * scale,
        );
      } catch {
        /* gambar gagal dimuat tetap dicetak sebagai placeholder */
      }
    },
  });

  return doc;
}

export function downloadLaporanPdf(opts: LaporanOptions) {
  const doc = generateLaporanPdf(opts);
  doc.save(`${opts.fileName}.pdf`);
}

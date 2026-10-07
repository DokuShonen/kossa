package com.kossa.controller;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import com.kossa.entity.Reclamation;
import com.kossa.repository.ReclamationRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/stats/rapports")
public class RapportExportController {

    @Autowired private ReclamationRepository reclamationRepository;

    @GetMapping("/excel")
    public ResponseEntity<byte[]> exporterExcel(
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date fin) {
        List<Reclamation> reclamations;
        if (debut != null && fin != null) {
            reclamations = reclamationRepository.findByDateCreationBetween(debut, fin);
        } else if (statut != null && !statut.isEmpty()) {
            reclamations = reclamationRepository.findByStatut(statut);
        } else {
            reclamations = reclamationRepository.findAll();
        }

        StringBuilder csv = new StringBuilder();
        csv.append("Référence;Objet;Type;Canal;Statut;Priorité;Date Création;Date Échéance;Client\r\n");

        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm");
        for (Reclamation r : reclamations) {
            csv.append(String.format("%s;%s;%s;%s;%s;%s;%s;%s;%s\r\n",
                    escapeCsv(r.getReference()),
                    escapeCsv(r.getObjet()),
                    escapeCsv(r.getType()),
                    escapeCsv(r.getCanalNom() != null ? r.getCanalNom() : ""),
                    escapeCsv(r.getStatut()),
                    escapeCsv(r.getPriorite()),
                    r.getDateCreation() != null ? sdf.format(r.getDateCreation()) : "",
                    r.getDateEcheance() != null ? sdf.format(r.getDateEcheance()) : "",
                    escapeCsv(r.getClient() != null ? r.getClient().getNom() + " " + r.getClient().getPrenom() : "")
            ));
        }

        byte[] content = csv.toString().getBytes(Charset.forName("Windows-1252"));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rapport_reclamations.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=windows-1252"))
                .body(content);
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exporterPDF(
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date fin) {
        List<Reclamation> reclamations;
        if (debut != null && fin != null) {
            reclamations = reclamationRepository.findByDateCreationBetween(debut, fin);
        } else if (statut != null && !statut.isEmpty()) {
            reclamations = reclamationRepository.findByStatut(statut);
        } else {
            reclamations = reclamationRepository.findAll();
        }

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 30, 30, 30, 30);
            PdfWriter.getInstance(document, out);
            document.open();

            // Couleurs KOSSA
            Color kossaBlue = new Color(0, 96, 168);
            Color kossaOrange = new Color(243, 122, 33);
            Color lightBg = new Color(235, 245, 255);
            Color altRowBg = new Color(248, 250, 252);
            Color borderGray = new Color(226, 232, 240);

            // Fonts
            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, kossaBlue);
            Font fontSubTitle = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(85, 87, 112));
            Font fontMeta = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(0, 74, 135));
            Font fontHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            Font fontCell = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.BLACK);
            Font fontCellBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.BLACK);
            Font fontFooter = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(113, 128, 150));

            // En-tête avec Logo et Titre
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{1.5f, 4f});

            PdfPCell logoCell = new PdfPCell();
            logoCell.setBorder(Rectangle.NO_BORDER);
            try {
                InputStream is = getClass().getResourceAsStream("/static/Kossa_Africa_logo.png");
                if (is != null) {
                    Image logo = Image.getInstance(is.readAllBytes());
                    logo.scaleToFit(110, 45);
                    logoCell.addElement(logo);
                }
            } catch (Exception ignored) {}
            headerTable.addCell(logoCell);

            PdfPCell titleCell = new PdfPCell();
            titleCell.setBorder(Rectangle.NO_BORDER);
            titleCell.addElement(new Paragraph("KOSSA Africa   Kossa", fontTitle));
            titleCell.addElement(new Paragraph("Rapport Officiel d'Extraction des Réclamations", fontSubTitle));
            headerTable.addCell(titleCell);

            document.add(headerTable);

            // Ligne séparatrice orange
            Paragraph divider = new Paragraph(" ");
            divider.setSpacingBefore(2);
            divider.setSpacingAfter(5);
            document.add(divider);

            PdfPTable lineTable = new PdfPTable(1);
            lineTable.setWidthPercentage(100);
            PdfPCell lineCell = new PdfPCell();
            lineCell.setBackgroundColor(kossaOrange);
            lineCell.setFixedHeight(3);
            lineCell.setBorder(Rectangle.NO_BORDER);
            lineTable.addCell(lineCell);
            document.add(lineTable);

            // Boîte Métadonnées
            PdfPTable metaTable = new PdfPTable(3);
            metaTable.setWidthPercentage(100);
            metaTable.setSpacingBefore(12);
            metaTable.setSpacingAfter(15);

            String periodStr;
            if (debut != null && fin != null) {
                SimpleDateFormat sdfDate = new SimpleDateFormat("dd/MM/yyyy");
                periodStr = "Période : Du " + sdfDate.format(debut) + " au " + sdfDate.format(fin);
            } else if (statut != null && !statut.isEmpty()) {
                periodStr = "Filtre statut : " + statut;
            } else {
                periodStr = "Période : Toutes les réclamations";
            }

            String dateGenStr = "Généré le : " + new SimpleDateFormat("dd/MM/yyyy à HH:mm").format(new Date());
            String totalStr = "Total dossiers : " + reclamations.size();

            addMetaCell(metaTable, periodStr, fontMeta, lightBg, borderGray);
            addMetaCell(metaTable, totalStr, fontMeta, lightBg, borderGray);
            addMetaCell(metaTable, dateGenStr, fontMeta, lightBg, borderGray);
            document.add(metaTable);

            // Tableau des réclamations
            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2.2f, 3.8f, 2.2f, 2f, 1.8f, 2.5f});

            String[] headers = {"Référence", "Objet / Client", "Type", "Statut", "Priorité", "Date Création"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, fontHeader));
                cell.setBackgroundColor(kossaBlue);
                cell.setPadding(6);
                cell.setBorderColor(borderGray);
                cell.setHorizontalAlignment(Element.ALIGN_LEFT);
                table.addCell(cell);
            }

            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm");
            boolean isEven = false;

            for (Reclamation r : reclamations) {
                Color bg = isEven ? altRowBg : Color.WHITE;
                isEven = !isEven;

                String clientInfo = r.getClient() != null ? r.getClient().getNom() + " " + r.getClient().getPrenom() : "";
                String objetStr = r.getObjet() != null ? r.getObjet() : (r.getDescription() != null ? r.getDescription() : " ");
                if (!clientInfo.isEmpty()) {
                    objetStr = objetStr + " (" + clientInfo + ")";
                }

                addTableCell(table, r.getReference() != null ? r.getReference() : " ", fontCellBold, bg, borderGray);
                addTableCell(table, objetStr, fontCell, bg, borderGray);
                addTableCell(table, r.getType() != null ? r.getType() : " ", fontCell, bg, borderGray);
                addTableCell(table, r.getStatut() != null ? r.getStatut() : " ", fontCell, bg, borderGray);
                addTableCell(table, r.getPriorite() != null ? r.getPriorite() : " ", fontCell, bg, borderGray);
                addTableCell(table, r.getDateCreation() != null ? sdf.format(r.getDateCreation()) : " ", fontCell, bg, borderGray);
            }

            document.add(table);

            // Pied de page
            Paragraph footer = new Paragraph("Document confidentiel généré automatiquement par KOSSA Kossa   KOSSA Africa", fontFooter);
            footer.setSpacingBefore(20);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();

            byte[] pdfBytes = out.toByteArray();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rapport_reclamations.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    private void addMetaCell(PdfPTable table, String text, Font font, Color bg, Color border) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setPadding(8);
        cell.setBorderColor(border);
        table.addCell(cell);
    }

    private void addTableCell(PdfPTable table, String text, Font font, Color bg, Color border) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setPadding(6);
        cell.setBorderColor(border);
        table.addCell(cell);
    }

    private String escapeCsv(String input) {
        if (input == null) return "";
        if (input.contains(";") || input.contains("\"") || input.contains("\n")) {
            return "\"" + input.replace("\"", "\"\"") + "\"";
        }
        return input;
    }
}

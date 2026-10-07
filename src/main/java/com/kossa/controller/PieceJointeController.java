package com.kossa.controller;

import com.kossa.entity.*;
import com.kossa.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/reclamations/{reclamationId}/pieces-jointes")
public class PieceJointeController {

    @Autowired private ReclamationRepository reclamationRepository;
    @Autowired private PieceJointeRepository pieceJointeRepository;

    private final Path uploadDir = Paths.get("uploads");

    @PostMapping
    public ResponseEntity<?> uploadPieceJointe(@PathVariable Long reclamationId,
                                                @RequestParam("file") MultipartFile file) {
        try {
            Reclamation rec = reclamationRepository.findById(reclamationId)
                    .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));

            Files.createDirectories(uploadDir);

            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = uploadDir.resolve(fileName);
            file.transferTo(filePath.toFile());

            PieceJointe pj = new PieceJointe();
            pj.setNomFichier(file.getOriginalFilename());
            pj.setType(file.getContentType());
            pj.setCheminFichier(filePath.toString());
            pj.setTailleOctets(file.getSize());
            pj.setReclamation(rec);

            pieceJointeRepository.save(pj);

            return ResponseEntity.status(HttpStatus.CREATED).body(pj);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erreur", "Échec de l'upload: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<PieceJointe>> lister(@PathVariable Long reclamationId) {
        Reclamation rec = reclamationRepository.findById(reclamationId)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        return ResponseEntity.ok(rec.getPiecesJointes());
    }

    @DeleteMapping("/{pjId}")
    public ResponseEntity<Void> supprimer(@PathVariable Long reclamationId, @PathVariable Long pjId) {
        PieceJointe pj = pieceJointeRepository.findById(pjId)
                .orElseThrow(() -> new RuntimeException("Pièce jointe introuvable"));

        try {
            Path filePath = Paths.get(pj.getCheminFichier());
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {
        }

        pieceJointeRepository.delete(pj);
        return ResponseEntity.noContent().build();
    }
}

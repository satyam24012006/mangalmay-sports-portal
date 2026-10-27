package com.mangalmay.sports.web;

import com.mangalmay.sports.dto.Dtos.*;
import com.mangalmay.sports.model.User;
import com.mangalmay.sports.service.EnrollmentService;
import com.mangalmay.sports.service.EnrollmentService.ProofFile;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {
    private final EnrollmentService service;

    public EnrollmentController(EnrollmentService service) { this.service = service; }

    @GetMapping("/mine")
    public List<EnrollmentDto> mine(@AuthenticationPrincipal User me) { return service.mine(me); }

    @GetMapping("/{id}")
    public EnrollmentDto get(@PathVariable UUID id, @AuthenticationPrincipal User me) { return service.get(id, me); }

    @PutMapping("/draft")
    public EnrollmentDto saveDraft(@Valid @RequestBody EnrollmentDraftRequest r, @AuthenticationPrincipal User me) {
        return service.saveDraft(me, r);
    }

    @PostMapping(path = "/{id}/payment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public EnrollmentDto pay(@PathVariable UUID id, @RequestParam("utr") String utr,
                             @RequestParam("file") MultipartFile file, @AuthenticationPrincipal User me) {
        return service.submitPayment(me, id, utr, file);
    }

    @GetMapping("/{id}/proof")
    public ResponseEntity<byte[]> proof(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        ProofFile f = service.proof(id, me);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(f.contentType()))
                .cacheControl(CacheControl.noStore())
                .header("Content-Disposition", "inline")
                .body(f.bytes());
    }
}

package com.mangalmay.sports.service;

import com.mangalmay.sports.web.ApiException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/** Stores payment screenshots on disk (outside any public path). Only real PNG/JPEG/WEBP bytes are accepted. */
@Service
public class FileStorageService {
    private final Path root;

    public FileStorageService(@Value("${app.upload-dir}") String dir) throws IOException {
        this.root = Paths.get(dir).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    public String saveProof(MultipartFile file) {
        if (file == null || file.isEmpty()) throw ApiException.badRequest("Payment screenshot is required.");
        try {
            byte[] bytes = file.getBytes();
            String ext = detectExtension(bytes);
            if (ext == null) throw ApiException.badRequest("Only PNG, JPG or WEBP images are allowed.");
            String name = UUID.randomUUID() + "." + ext;
            Files.write(root.resolve(name), bytes);
            return name;
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store the uploaded file.");
        }
    }

    public byte[] load(String name) {
        try {
            Path p = root.resolve(name).normalize();
            if (!p.startsWith(root) || !Files.isRegularFile(p)) throw ApiException.notFound("File not found.");
            return Files.readAllBytes(p);
        } catch (IOException e) {
            throw ApiException.notFound("File not found.");
        }
    }

    public String contentType(String name) {
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    public void delete(String name) {
        if (name == null) return;
        try {
            Path p = root.resolve(name).normalize();
            if (p.startsWith(root)) Files.deleteIfExists(p);
        } catch (IOException ignored) {
            // best effort
        }
    }

    private static String detectExtension(byte[] b) {
        if (b.length < 12) return null;
        if ((b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return "png";
        if ((b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "jpg";
        if (b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "webp";
        return null;
    }
}

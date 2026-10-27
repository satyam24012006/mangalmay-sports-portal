package com.mangalmay.sports.web;

import com.mangalmay.sports.dto.Dtos.*;
import com.mangalmay.sports.service.CatalogService;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Public, read-only. */
@RestController
@RequestMapping("/api")
public class CatalogController {
    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) { this.catalog = catalog; }

    @GetMapping("/events")
    public List<EventDto> events() { return catalog.events(); }

    @GetMapping("/sports")
    public List<SportDto> sports(@RequestParam(required = false) UUID eventId) { return catalog.sports(eventId); }
}

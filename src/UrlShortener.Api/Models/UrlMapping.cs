using System;

namespace UrlShortener.Api.Models
{
    public class UrlMapping
    {
        public int Id { get; set; }
        public string Code { get; set; } = null!;
        public string OriginalUrl { get; set; } = null!;
        public DateTime CreatedAtUtc { get; set; }
        public long ClickCount { get; set; }
    }
}

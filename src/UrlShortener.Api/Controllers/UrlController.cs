using Microsoft.AspNetCore.Mvc;
using UrlShortener.Api.Models;
using UrlShortener.Api.Services;

namespace UrlShortener.Api.Controllers
{
    [ApiController]
    [Route("/")]
    public class UrlController : ControllerBase
    {
        private readonly IUrlShorteningService _service;

        public UrlController(IUrlShorteningService service)
        {
            _service = service;
        }

        [HttpPost("shorten")]
        public async Task<IActionResult> Shorten([FromBody] ShortenRequest request)
        {
            if (request?.Url is null)
                return BadRequest(new { error = "Url is required." });

            try
            {
                var mapping = await _service.CreateShortUrlAsync(request.Url);
                var scheme = Request.Scheme;
                var host = Request.Host.Value;
                var shortUrl = $"{scheme}://{host}/{mapping.Code}";

                return CreatedAtAction(nameof(RedirectToOriginal), new { code = mapping.Code }, new ShortenResponse
                {
                    Code = mapping.Code,
                    ShortUrl = shortUrl,
                    OriginalUrl = mapping.OriginalUrl,
                    ClickCount = mapping.ClickCount
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("links")]
        public async Task<IActionResult> ListLinks()
        {
            var list = await _service.GetAllAsync();
            var baseUrl = $"{Request.Scheme}://{Request.Host.Value}";

            var response = list.Select(x => new UrlInfo
            {
                Code = x.Code,
                OriginalUrl = x.OriginalUrl,
                ShortUrl = $"{baseUrl}/{x.Code}",
                ClickCount = x.ClickCount,
                CreatedAtUtc = x.CreatedAtUtc
            });

            return Ok(response);
        }

        [HttpGet("{code:length(6,16)}")]
        public async Task<IActionResult> RedirectToOriginal(string code)
        {
            var mapping = await _service.GetByCodeAsync(code);
            if (mapping == null)
                return NotFound();

            await _service.IncrementClickCountAsync(mapping);
            return Redirect(mapping.OriginalUrl);
        }
    }

    public class ShortenRequest
    {
        public string Url { get; set; } = null!;
    }

    public class ShortenResponse
    {
        public string Code { get; set; } = null!;
        public string ShortUrl { get; set; } = null!;
        public string OriginalUrl { get; set; } = null!;
        public long ClickCount { get; set; }
    }

    public class UrlInfo
    {
        public string Code { get; set; } = null!;
        public string OriginalUrl { get; set; } = null!;
        public string ShortUrl { get; set; } = null!;
        public long ClickCount { get; set; }
        public DateTime CreatedAtUtc { get; set; }
    }
}

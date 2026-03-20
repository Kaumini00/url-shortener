using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using UrlShortener.Api;
using Xunit;

namespace UrlShortener.Api.Tests
{
    public class UrlControllerTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public UrlControllerTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task PostShorten_ReturnsCreatedAndShortUrl()
        {
            var client = _factory.CreateClient();
            var request = new { url = "https://example.com/test-url" };

            var response = await client.PostAsJsonAsync("/shorten", request);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<ShortenResponse>();
            Assert.NotNull(result);
            Assert.NotEmpty(result!.Code);
            Assert.Contains("/", result.ShortUrl);
            Assert.Equal(request.url, result.OriginalUrl);
        }

        [Fact]
        public async Task GetLinks_ReturnsLinksList()
        {
            var client = _factory.CreateClient();
            var request = new { url = "https://example.com/list-url" };
            await client.PostAsJsonAsync("/shorten", request);

            var response = await client.GetAsync("/links");
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<UrlInfo[]>();
            Assert.NotNull(result);
            Assert.Contains(result!, x => x.OriginalUrl == request.url);
        }

        private class ShortenResponse
        {
            public string Code { get; set; } = null!;
            public string ShortUrl { get; set; } = null!;
            public string OriginalUrl { get; set; } = null!;
            public long ClickCount { get; set; }
        }

        private class UrlInfo
        {
            public string Code { get; set; } = null!;
            public string ShortUrl { get; set; } = null!;
            public string OriginalUrl { get; set; } = null!;
            public long ClickCount { get; set; }
            public DateTime CreatedAtUtc { get; set; }
        }
    }
}

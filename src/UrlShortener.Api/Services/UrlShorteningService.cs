using Microsoft.EntityFrameworkCore;
using UrlShortener.Api.Data;
using UrlShortener.Api.Models;

namespace UrlShortener.Api.Services
{
    public class UrlShorteningService : IUrlShorteningService
    {
        private readonly UrlDbContext _dbContext;
        private static readonly char[] _alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".ToCharArray();
        private readonly Random _random = new();

        public UrlShorteningService(UrlDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<UrlMapping> CreateShortUrlAsync(string originalUrl)
        {
            if (!Uri.TryCreate(originalUrl, UriKind.Absolute, out var uri)
                || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                throw new ArgumentException("Invalid URL format. Use http:// or https://.");
            }

            var code = await GenerateUniqueCodeAsync();
            var mapping = new UrlMapping
            {
                Code = code,
                OriginalUrl = originalUrl,
                CreatedAtUtc = DateTime.UtcNow,
                ClickCount = 0
            };

            _dbContext.UrlMappings.Add(mapping);
            await _dbContext.SaveChangesAsync();

            return mapping;
        }

        public async Task<UrlMapping?> GetByCodeAsync(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
                return null;

            return await _dbContext.UrlMappings.FirstOrDefaultAsync(x => x.Code == code);
        }

        public async Task<IReadOnlyList<UrlMapping>> GetAllAsync()
        {
            return await _dbContext.UrlMappings
                .OrderByDescending(x => x.CreatedAtUtc)
                .ToListAsync();
        }

        public async Task IncrementClickCountAsync(UrlMapping urlMapping)
        {
            if (urlMapping is null)
                throw new ArgumentNullException(nameof(urlMapping));

            urlMapping.ClickCount++;
            await _dbContext.SaveChangesAsync();
        }

        private async Task<string> GenerateUniqueCodeAsync(int length = 6)
        {
            while (true)
            {
                var code = GenerateRandomCode(length);
                var existing = await _dbContext.UrlMappings.AnyAsync(x => x.Code == code);
                if (!existing)
                    return code;
            }
        }

        private string GenerateRandomCode(int length)
        {
            var buffer = new char[length];
            for (var i = 0; i < length; i++)
                buffer[i] = _alphabet[_random.Next(_alphabet.Length)];
            return new string(buffer);
        }
    }
}

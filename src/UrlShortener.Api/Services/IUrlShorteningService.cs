using UrlShortener.Api.Models;

namespace UrlShortener.Api.Services
{
    public interface IUrlShorteningService
    {
        Task<UrlMapping> CreateShortUrlAsync(string originalUrl);
        Task<UrlMapping?> GetByCodeAsync(string code);
        Task<IReadOnlyList<UrlMapping>> GetAllAsync();
        Task IncrementClickCountAsync(UrlMapping urlMapping);
    }
}

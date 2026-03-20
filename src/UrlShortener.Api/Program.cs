using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using UrlShortener.Api.Data;
using UrlShortener.Api.Services;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    WebRootPath = "frontend"
});

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<UrlDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=urlshortener.db"));

builder.Services.AddScoped<IUrlShorteningService, UrlShorteningService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<UrlDbContext>();
    db.Database.EnsureCreated();
}

Console.WriteLine($"ContentRootPath={app.Environment.ContentRootPath}");
Console.WriteLine($"WebRootPath={app.Environment.WebRootPath}");
Console.WriteLine($"Style exists: {app.Environment.WebRootFileProvider.GetFileInfo("style.css").Exists}");


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseDefaultFiles(new DefaultFilesOptions 
{ 
    DefaultFileNames = new[] { "index.html" }
});

var staticFileOptions = new StaticFileOptions();
app.UseStaticFiles(staticFileOptions);

app.Use(async (ctx, next) =>
{
    Console.WriteLine($"[LOG] Request: {ctx.Request.Method} {ctx.Request.Path}");
    await next();
});

app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program { }


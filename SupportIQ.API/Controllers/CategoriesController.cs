using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportIQ.Infrastructure.Data;

namespace SupportIQ.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer,Admin,Agent")]
    public class CategoriesController : ControllerBase
    {
        private readonly SupportIQDbContext _context;

        public CategoriesController(SupportIQDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
        {
            var categories = await _context.Categories
                .AsNoTracking()
                .Where(c => c.IsActive)
                .OrderBy(c => c.CategoryName)
                .Select(c => new
                {
                    Id = c.CategoryId,
                    Name = c.CategoryName,
                    Description = c.Description
                })
                .ToListAsync(cancellationToken);

            return Ok(categories);
        }
    }
}

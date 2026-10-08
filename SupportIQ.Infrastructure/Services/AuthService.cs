using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SupportIQ.Application.DTOs.Auth;
using SupportIQ.Application.Interfaces;
using SupportIQ.Domain.Entities;
using SupportIQ.Infrastructure.Data;

namespace SupportIQ.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly SupportIQDbContext _context;
        private readonly PasswordHasher<User> _passwordHasher;
        private readonly IJwtTokenService _jwtTokenService;

        public AuthService(SupportIQDbContext context, IJwtTokenService jwtTokenService)
        {
            _context = context;
            _jwtTokenService = jwtTokenService;
            _passwordHasher = new PasswordHasher<User>();
        }

        public async Task<bool> RegisterAsync(RegisterRequest request)
        {
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if(existingUser != null)
            {
                return false;
            }

            var user = new User
            {
                Name = request.Name,
                Email = request.Email,
                RoleId = 1,
                IsActive = true,
                CreatedOn = DateTime.Now
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == request.Email);
            if(user == null || !user.IsActive)
            {
                return null;
            }

            var passwordResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

            if(passwordResult == PasswordVerificationResult.Failed)
            {
                return null;
            }

            user.LastLogin = DateTime.Now;
            await _context.SaveChangesAsync();

            var token = _jwtTokenService.GenerateToken(user, user.Role.RoleName);

            return new LoginResponse
            {
                Token = token,
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role.RoleName
            };
        }
    }
}

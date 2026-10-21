using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace SupportIQ.Application.DTOs.Tickets
{
    public class CreateTicketRequest
    {
        [Required]
        [StringLength(150, MinimumLength = 3)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        [StringLength(5000, MinimumLength = 5)]
        public string Description { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int? CategoryId { get; set; }
    }
}

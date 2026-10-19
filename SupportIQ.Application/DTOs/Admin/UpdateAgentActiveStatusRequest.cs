using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Application.DTOs.Admin
{
    public class UpdateAgentActiveStatusRequest
    {
        [Required]
        public bool? IsActive { get; set; }
    }
}

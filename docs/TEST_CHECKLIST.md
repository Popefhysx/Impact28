# Impact OS Test Checklist

> Manual QA test cases for Admin Panel and Participant Dashboard

---

## Admin Panel Tests

### Authentication
- [ ] Login with valid admin credentials
- [ ] Invalid credentials shows error
- [ ] Session persists after page refresh
- [ ] Logout redirects to login page

---

### Dashboard (`/admin`)
- [ ] Stats cards display with correct values
- [ ] Quick action cards are clickable
- [ ] Sidebar navigation is functional
- [ ] Mobile menu toggle works

---

### Applicants (`/admin/applicants`)
- [ ] List loads with applicant data
- [ ] Search filters results correctly
- [ ] Status filter (Pending/Approved/Rejected) works
- [ ] Click row opens applicant detail
- [ ] Approve applicant changes status
- [ ] Reject applicant changes status
- [ ] Send offer opens offer dialog
- [ ] Card view toggle works on mobile

---

### Participants (`/admin/participants`)
- [ ] List loads with participant data
- [ ] Search filters results correctly
- [ ] Click row opens participant detail
- [ ] Detail page shows currency balances
- [ ] Detail page shows mission history
- [ ] Card view toggle works on mobile

---

### Staff (`/admin/staff`)
- [ ] List shows all staff members
- [ ] Add Staff button opens modal
- [ ] Create new staff with valid data
- [ ] Edit staff role (Admin/Staff)
- [ ] Delete staff removes from list

---

### Missions (`/admin/missions`)
- [ ] Missions list loads
- [ ] Create new mission with all fields
- [ ] Edit mission updates correctly
- [ ] Delete mission removes from list
- [ ] Pending tab shows submissions
- [ ] Verify submission credits XP
- [ ] Reject submission with feedback

---

### Income (`/admin/income`)
- [ ] Income submissions list loads
- [ ] Approve income proof
- [ ] Reject income proof with reason
- [ ] Totals display correctly

---

### Support (`/admin/support`)
- [ ] Support requests list loads
- [ ] Filter by status works
- [ ] Approve request sets expiration
- [ ] Reject request with reason
- [ ] Expired requests show correctly

---

### Communications (`/admin/communications`)
- [ ] Email log displays sent emails
- [ ] Compose button opens editor
- [ ] Template dropdown loads templates
- [ ] Variable insertion works ({{firstName}})
- [ ] Send test email works
- [ ] Send to cohort delivers correctly

---

### Email Templates (`/admin/email-templates`)
- [ ] Template list loads
- [ ] Create new template
- [ ] Edit template content
- [ ] Preview shows rendered HTML
- [ ] Delete template removes from list

---

### Partners (`/admin/partners`)
- [ ] Partners grid displays logos
- [ ] Add new partner with logo
- [ ] Edit partner details
- [ ] Delete partner removes card

---

### Testimonials (`/admin/testimonials`)
- [ ] Submissions list loads
- [ ] Approve testimonial shows on website
- [ ] Reject testimonial removes from pending
- [ ] Edit testimonial content

---

### Settings - Cohorts (`/admin/settings/cohorts`)
- [ ] Cohorts list with enrollment counts
- [ ] Create new cohort with dates
- [ ] Edit cohort details
- [ ] Delete cohort (only if empty)

---

### Settings - Phases (`/admin/settings/phases`)
- [ ] Phases list ordered correctly
- [ ] Create new phase with duration
- [ ] Edit phase name/duration
- [ ] Drag to reorder updates order
- [ ] Delete phase removes from list

---

### Settings - Calendar (`/admin/settings/calendar`)
- [ ] Events list displays correctly
- [ ] Create event with date/time/type
- [ ] Edit event updates correctly
- [ ] Delete event removes from list
- [ ] Cohort-specific event filtering

---

### Settings - Config (`/admin/settings/config`)
- [ ] Current values load correctly
- [ ] Edit program name saves
- [ ] Edit OTP expiry saves
- [ ] Toggle self-signup saves
- [ ] Support TTL setting saves

---

## Participant Dashboard Tests

### Authentication
- [ ] Request OTP with valid email
- [ ] OTP arrives in email inbox
- [ ] Enter OTP logs in successfully
- [ ] Invalid OTP shows error
- [ ] Session persists after refresh

---

### Dashboard Home (`/dashboard`)
- [ ] Welcome message shows name
- [ ] Streak counter is accurate
- [ ] Currency cards show balances
  - [ ] Momentum
  - [ ] Skill XP
  - [ ] Arena Points
  - [ ] Verified Income
- [ ] Phase tracker shows current phase
- [ ] Phase progress bar is accurate
- [ ] Upcoming events show next 3
- [ ] Active missions section loads
- [ ] Journey timeline shows history
- [ ] Quick stats footer correct

---

### Missions (`/dashboard/missions`)
- [ ] Assigned missions list loads
- [ ] Mission card shows details
- [ ] Start mission button works
- [ ] Submit mission opens form
- [ ] File upload works
- [ ] Pending status after submit
- [ ] XP credited on approval

---

### Income (`/dashboard/income`)
- [ ] Total verified income displays
- [ ] Submit income proof button works
- [ ] Upload receipt/screenshot
- [ ] Enter amount and source
- [ ] Submission history shows all entries
- [ ] Status badges (Pending/Approved/Rejected)

---

### Support (`/dashboard/support`)
- [ ] Request support button works
- [ ] Select support type
- [ ] Enter request details
- [ ] Submit creates new request
- [ ] Request history shows entries
- [ ] Status updates when approved
- [ ] Expired requests show expired badge

---

### Currency (`/dashboard/currency`)
- [ ] All balances display correctly
- [ ] Transaction history loads
- [ ] Filter by currency type
- [ ] Credits show positive amounts
- [ ] Debits show negative amounts

---

### Profile (`/dashboard/profile`)
- [ ] Profile info displays correctly
- [ ] Email is shown
- [ ] Skill track displays
- [ ] Identity level displays
- [ ] Basic edit fields work

---

### Resources (`/dashboard/resources`)
- [ ] Resources list loads
- [ ] Categories filter works
- [ ] Click resource opens viewer
- [ ] Download button works
- [ ] Search filters results

---

### Help (`/dashboard/help`)
- [ ] FAQ section displays
- [ ] Contact support link works

---

## Cross-Cutting Tests

### Responsive Design
- [ ] Admin sidebar collapses on tablet
- [ ] Admin mobile menu works
- [ ] Participant sidebar collapses
- [ ] Tables convert to cards on mobile
- [ ] Forms are usable on mobile

### Error Handling
- [ ] 404 page displays for bad routes
- [ ] API errors show user-friendly messages
- [ ] Loading states show spinners
- [ ] Empty states have helpful messages

### Data Integrity
- [ ] Currency operations are atomic
- [ ] Mission XP credits correctly
- [ ] Phase progression is accurate
- [ ] Support expiry timing correct

# 📊 Movie Madders: Feature & Component Matrix

**Legend**:
- ✅ **Done**: Fully implemented & connected to Backend.
- 🚧 **Partial**: UI exists, but uses some mock data or partial API.
- ❌ **Todo**: UI exists but uses 100% mock data (needs Backend).
- ⬜ **Missing**: Feature not yet started.

---

## 1. 🔐 Authentication & Users
| Component | Status | Backend API | Notes |
| :--- | :---: | :--- | :--- |
| **Login Form** | ✅ | `/auth/token` | Working. |
| **Signup Form** | ✅ | `/auth/signup` | Working. |
| **User Profile** | 🚧 | `/users/me` | Basic info works. Banner/Avatar upload needs verification. |
| **Role Switcher** | ❌ | `/users/roles` | UI exists. Backend support for multi-role switching needs check. |

## 2. 🎬 Movies & Content
| Component | Status | Backend API | Notes |
| :--- | :---: | :--- | :--- |
| **Movie List (Explore)** | ✅ | `/movies` | Filtering & Pagination working. |
| **Movie Details (Hero)** | ✅ | `/movies/{id}` | Fetches real data. |
| **Cast & Crew** | 🚧 | `/movies/{id}/credits` | Needs verification of full data depth. |
| **Where to Watch** | ❌ | `/movies/{id}/watch` | Likely mock data. |
| **Visual Treats** | ❌ | `/visual-treats` | UI exists, likely mock data. |

## 3. ⭐ Reviews & Ratings
| Component | Status | Backend API | Notes |
| :--- | :---: | :--- | :--- |
| **Review List** | ✅ | `/reviews` | Working. |
| **Review Card** | ✅ | `/reviews/{id}` | Display working. |
| **Create Review** | ✅ | `POST /reviews` | Working. |
| **Edit/Delete Review** | ✅ | `PUT/DELETE` | Verified & Fixed. |
| **Review Voting** | ✅ | `/reviews/{id}/vote` | Verified & Fixed. |
| **Review Comments** | ✅ | `/reviews/{id}/comments` | **Backend complete**. API, models, repository implemented. Frontend connected. |

## 4. 💬 Pulse (Social Feed)
| Component | Status | Backend API | Notes |
| :--- | :---: | :--- | :--- |
| **Pulse Feed** | ✅ | `/pulse/feed` | Working. |
| **Create Pulse** | ✅ | `POST /pulse` | Working (with Hashtags/Mentions). |
| **Comments** | 🚧 | `/pulse/{id}/comments` | UI needs verification of depth/nesting. |
| **Trending Topics** | ❌ | `/pulse/trending` | Likely mock data. |

## 5. 👑 Admin & Curation
| Component | Status | Backend API | Notes |
| :--- | :---: | :--- | :--- |
| **TMDB Import** | ✅ | `/admin/import` | Working. |
| **Movie Editor** | 🚧 | `/admin/movies/{id}` | Complex forms need audit. |
| **Critic Approval** | ❌ | `/admin/critics` | Workflow needs verification. |

## 6. 🏆 Awards & Festivals
| Component | Status | Backend API | Notes |
| :--- | :---: | :--- | :--- |
| **Festival List** | ❌ | `/festivals` | Mock data. |
| **Award Winners** | ❌ | `/awards` | Mock data. |

---

## 📉 Next Priorities (Recommended)
1.  **Trending Topics (Pulse)**: Connect to real aggregation.
2.  **Role Switcher**: Ensure multi-role profile switching works.
3.  **Visual Treats**: Implement backend for this unique feature.

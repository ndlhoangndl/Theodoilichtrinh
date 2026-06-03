import { apiGetAdminUsers, apiDeleteUser, apiUpdateUserRole } from '../../services/api';
import { state } from '../common/state';

export function renderAdminPage(): void {
  const tableBody = document.getElementById('admin-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align: center; padding: 20px; color: var(--text-muted);">
        ${state.currentLang === 'vi' ? '⌛ Đang tải dữ liệu từ MongoDB Atlas...' : '⌛ Loading data from MongoDB Atlas...'}
      </td>
    </tr>
  `;

  apiGetAdminUsers()
    .then(users => {
      if (!users || users.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 20px; color: var(--text-muted);">
              ${state.currentLang === 'vi' ? '📭 Không có người dùng nào khác trong hệ thống.' : '📭 No other users registered in the system.'}
            </td>
          </tr>
        `;
        return;
      }

      let html = '';
      users.forEach(u => {
        // Format gender
        let genderText = u.gender;
        if (u.gender === 'male') genderText = state.currentLang === 'vi' ? 'Nam 👨' : 'Male 👨';
        else if (u.gender === 'female') genderText = state.currentLang === 'vi' ? 'Nữ 👩' : 'Female 👩';
        else if (u.gender === 'other') genderText = state.currentLang === 'vi' ? 'Khác' : 'Other';

        // Format Date
        const regDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString(state.currentLang === 'vi' ? 'vi-VN' : 'en-US') : '---';

        // Format role color
        const roleColor = u.role === 'ADMIN' ? '#a94442' : 'var(--text-muted)';
        const roleText = u.role === 'ADMIN' ? (state.currentLang === 'vi' ? 'QUẢN TRỊ (ADMIN)' : 'ADMIN') : (state.currentLang === 'vi' ? 'THÀNH VIÊN (USER)' : 'USER');

        // Form actions column
        let actionsHtml = '';
        const isMasterAdmin = u.username === 'ndlhoangndl';
        const isCurrentUser = state.currentUser && u.username === state.currentUser.username;

        if (isMasterAdmin) {
          actionsHtml = `<span style="color:var(--text-muted); font-size:11px; font-weight:600;">👑 Master Admin</span>`;
        } else if (isCurrentUser) {
          actionsHtml = `<span style="color:var(--text-muted); font-size:11px; font-weight:600;">👤 ${state.currentLang === 'vi' ? 'Bạn' : 'You'}</span>`;
        } else {
          const btnRoleText = u.role === 'ADMIN' ? (state.currentLang === 'vi' ? 'Hạ cấp' : 'Demote') : (state.currentLang === 'vi' ? 'Thăng cấp' : 'Promote');
          const nextRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
          actionsHtml = `
            <div style="display: flex; gap: 6px; justify-content: center;">
              <button class="btn btn-sm btn-role-toggle" data-userid="${u._id}" data-role="${nextRole}" style="font-size:11px; padding:2px 6px; height:auto; background:var(--bg-widget); color:var(--text-main); border:1px solid var(--border-color); cursor:pointer;">
                🔑 ${btnRoleText}
              </button>
              <button class="btn btn-sm btn-delete-user" data-userid="${u._id}" data-username="${u.username}" style="font-size:11px; padding:2px 6px; height:auto; background:#a94442; color:#fff; border:none; cursor:pointer;">
                🗑️ ${state.currentLang === 'vi' ? 'Xoá' : 'Delete'}
              </button>
            </div>
          `;
        }

        html += `
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 12px 10px; font-weight:600; text-align: left;">
              <div style="display:flex; flex-direction:column;">
                <span style="color:var(--text-main);">${u.fullName}</span>
                <span style="font-size:11px; color:var(--text-muted); font-weight:normal;">@${u.username}</span>
              </div>
            </td>
            <td style="padding: 12px 10px; color:var(--text-muted); text-align: left;">${u.email}</td>
            <td style="padding: 12px 10px; text-align: center;">${genderText}</td>
            <td style="padding: 12px 10px; color:var(--text-muted); text-align: center;">${u.dob}</td>
            <td style="padding: 12px 10px; color:var(--text-muted); text-align: center;">${u.country || 'Vietnam'}</td>
            <td style="padding: 12px 10px; font-weight:700; color:${roleColor}; text-align: center;">${roleText}</td>
            <td style="padding: 12px 10px; color:var(--text-muted); text-align: center;">${regDate}</td>
            <td style="padding: 12px 10px; text-align: center;">${actionsHtml}</td>
          </tr>
        `;
      });

      tableBody.innerHTML = html;

      // Bind events to role toggle buttons
      tableBody.querySelectorAll('.btn-role-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLButtonElement;
          const userId = target.getAttribute('data-userid') || '';
          const newRole = target.getAttribute('data-role') || '';
          
          if (confirm(state.currentLang === 'vi' ? `Bạn có chắc muốn đổi quyền của người dùng này thành ${newRole}?` : `Are you sure you want to change this user's role to ${newRole}?`)) {
            apiUpdateUserRole(userId, newRole)
              .then(res => {
                alert(res.message || (state.currentLang === 'vi' ? 'Cập nhật thành công!' : 'Updated successfully!'));
                renderAdminPage();
              })
              .catch(err => {
                alert(state.currentLang === 'vi' ? `Lỗi: ${err.message}` : `Error: ${err.message}`);
              });
          }
        });
      });

      // Bind events to delete buttons
      tableBody.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLButtonElement;
          const userId = target.getAttribute('data-userid') || '';
          const username = target.getAttribute('data-username') || '';
          
          if (confirm(state.currentLang === 'vi' ? `CẢNH BÁO: Bạn có chắc chắn muốn XOÁ người dùng @${username}? Thao tác này không thể hoàn tác!` : `WARNING: Are you sure you want to DELETE user @${username}? This action cannot be undone!`)) {
            apiDeleteUser(userId)
              .then(res => {
                alert(res.message || (state.currentLang === 'vi' ? 'Đã xoá người dùng!' : 'User deleted!'));
                renderAdminPage();
              })
              .catch(err => {
                alert(state.currentLang === 'vi' ? `Lỗi: ${err.message}` : `Error: ${err.message}`);
              });
          }
        });
      });
    })
    .catch(err => {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 20px; color: #a94442;">
            ❌ ${state.currentLang === 'vi' ? 'Lỗi khi tải dữ liệu từ máy chủ: ' + err.message : 'Error loading data from server: ' + err.message}
          </td>
        </tr>
      `;
    });
}

export function initAdmin(): void {
  const btnRefresh = document.getElementById('btn-admin-refresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      renderAdminPage();
    });
  }
}


import fs from 'node:fs/promises';
const p='.codex-build/lichtrinh-slides-v2/build.mjs';let c=await fs.readFile(p,'utf8');
const pairs=[
 ["'ĐỀ TÀI  •  Ý TƯỞNG PHÁT TRIỂN ỨNG DỤNG DI ĐỘNG'","'ĐỀ TÀI  •  LẬP TRÌNH DI ĐỘNG'"],
 ["'Ý tưởng mới: Chatbot API  •  Khoảnh khắc học tập'","'Thói quen  •  Chatbot hỗ trợ  •  Khoảnh khắc học tập'"],
 ["slide(3,'Nền hiện tại và ý tưởng mở rộng','Tách chức năng của dự án web hiện tại khỏi tính năng mới nhóm đề xuất cho bản mobile.')","slide(3,'Chức năng của ứng dụng','Các chức năng phục vụ theo dõi thói quen, học tập và kết nối cá nhân.')"],
 ["'DỰ ÁN WEB NỀN  •  ĐANG CÓ'","'QUẢN LÝ CÁ NHÂN'"],
 ["'Ý TƯỞNG MỚI CHO APP MOBILE'","'TRỢ LÝ  &  TƯƠNG TÁC'"],
 ["['Chatbot API','Gợi ý học tập/thói quen qua dịch vụ AI.']","['Chatbot','Gợi ý học tập/thói quen qua dịch vụ AI.']"],
 ["['Mobile offline','Room cục bộ, đồng bộ qua API nền.']","['Tập trung & đồng bộ','Pomodoro, Room cục bộ và đồng bộ qua API.']"],
 ["'Chatbot và khoảnh khắc là ý tưởng mới; chưa có trong bản mobile hiện tại.'","'Kết hợp quản lý thói quen với trợ lý và chia sẻ khoảnh khắc học tập.'"],
 ["slide(4,'Hồ sơ Use Case đề xuất','UC-01 kế thừa nghiệp vụ nền; UC-02 và UC-03 là ý tưởng mới cho bản mobile.')","slide(4,'Hồ sơ Use Case','Mô tả tác nhân, điều kiện và luồng xử lý của các chức năng trọng tâm.')"],
 ["'Ý TƯỞNG MỚI CHO MOBILE'","'CHATBOT & KHOẢNH KHẮC'"],
 ["'UC-02  •  Chatbot qua API'","'UC-02  •  Chatbot hỗ trợ'"],
 ["slide(5,'Sơ đồ Use Case đề xuất cho bản mobile','Chatbot và chụp ảnh là luồng mới; phần còn lại kế thừa nghiệp vụ của dự án web.')","slide(5,'Sơ đồ Use Case','Các tương tác giữa người dùng, ứng dụng và dịch vụ hỗ trợ.')"],
 ["'APP LỊCH TRÌNH MOBILE  •  ĐỀ XUẤT'","'ỨNG DỤNG LỊCH TRÌNH'"],
 ["slide(7,'Kiến trúc dự kiến cho bản mobile','Đề xuất dùng Android client với API nền hiện có; route chatbot và lưu ảnh cần bổ sung.')","slide(7,'Công nghệ lõi và kiến trúc','Android kết nối API, lưu trữ cục bộ, cơ sở dữ liệu và dịch vụ AI/ảnh.')"],
 ["d:'API nền + route mới\\nJWT • bcrypt'","d:'API tài khoản + tracker + chatbot\\nJWT • bcrypt'"],
 ["h:'DỊCH VỤ MỞ RỘNG',t:'MongoDB\\nGemini API',d:'Dữ liệu cloud\\nAI API mới cho mobile'","h:'DỊCH VỤ TÍCH HỢP',t:'MongoDB\\nGemini API',d:'Dữ liệu cloud\\nTrợ lý chatbot'"],
 ["slide(8,'Ý tưởng chatbot và kết nối API','Chức năng đề xuất mới; backend hiện tại cần thêm endpoint cho ứng dụng mobile.')","slide(8,'Chatbot và kết nối API','Chatbot hỗ trợ lập kế hoạch học tập, duy trì thói quen và nhìn lại tiến độ.')"],
 ["'POST /api/ai/chat — endpoint mới, gửi câu hỏi và nhận trả lời.'","'POST /api/ai/chat — gửi câu hỏi và nhận gợi ý.'"],
 ["s.speakerNotes.text='Chatbot chưa có trong backend hiện tại. Cần bổ sung POST /api/ai/chat và giữ API key trong biến môi trường server; không gửi key từ app.'","s.speakerNotes.text='Backend xác thực yêu cầu, gọi Gemini API và trả gợi ý về ứng dụng; API key được lưu phía server.'"],
 ["slide(9,'Ý tưởng: Khoảnh khắc học tập và làm việc','Tính năng mới đề xuất; ảnh mặc định riêng tư, người dùng tự chọn chia sẻ.')","slide(9,'Khoảnh khắc học tập và làm việc','Chụp lại hoạt động đang làm, lưu theo thời gian và chủ động chia sẻ.')"],
 ["'LUỒNG DỰ KIẾN'","'LUỒNG SỬ DỤNG'"]
];
for(const [a,b] of pairs){if(!c.includes(a))throw new Error('Missing: '+a);c=c.replace(a,b);}
await fs.writeFile(p,c,'utf8');

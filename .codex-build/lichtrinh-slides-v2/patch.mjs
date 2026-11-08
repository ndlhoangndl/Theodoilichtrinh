import fs from 'node:fs/promises';
const p='.codex-build/lichtrinh-slides-v2/build.mjs'; let c=await fs.readFile(p,'utf8');
const pairs=[
 ["'ĐỀ TÀI  •  LẬP TRÌNH DI ĐỘNG'","'ĐỀ TÀI  •  Ý TƯỞNG PHÁT TRIỂN ỨNG DỤNG DI ĐỘNG'"],
 ["'Điểm danh  •  Chatbot hỗ trợ  •  Khoảnh khắc học tập'","'Ý tưởng mới: Chatbot API  •  Khoảnh khắc học tập'"],
 ["slide(3,'Chức năng ứng dụng','Phân phạm vi theo chức năng cốt lõi và phần mở rộng.')","slide(3,'Nền hiện tại và ý tưởng mở rộng','Tách chức năng của dự án web hiện tại khỏi tính năng mới nhóm đề xuất cho bản mobile.')"],
 ["'CHỨC NĂNG CỐT LÕI  •  MVP'","'DỰ ÁN WEB NỀN  •  ĐANG CÓ'"],
 ["'CHỨC NĂNG MỞ RỘNG'","'Ý TƯỞNG MỚI CHO APP MOBILE'"],
 ["const R=[['Chatbot AI','Gợi ý kế hoạch học tập/thói quen qua API.'],['Khoảnh khắc','Chụp ảnh, lưu cùng thời gian và ghi chú.'],['Chia sẻ riêng tư','Gửi ảnh tới nhóm bạn được chọn.'],['Tập trung','Pomodoro, thông báo và đồng bộ dữ liệu.']]","const R=[['Chatbot API','Gợi ý học tập/thói quen qua dịch vụ AI.'],['Khoảnh khắc','Chụp ảnh lúc học/làm, lưu kèm ghi chú.'],['Chia sẻ ảnh','Gửi ảnh tới nhóm bạn được chọn.'],['Mobile offline','Room cục bộ, đồng bộ qua API nền.']]"] ,
 ["'Đề xuất: hoàn thiện thói quen + Room trước; chatbot và ảnh là phần mở rộng có kiểm soát.'","'Chatbot và khoảnh khắc là ý tưởng mới; chưa có trong bản mobile hiện tại.'"],
 ["slide(4,'Hồ sơ Use Case','Đặc tả luồng chính và các luồng mở rộng để nhóm thống nhất cách triển khai.')","slide(4,'Hồ sơ Use Case đề xuất','UC-01 kế thừa nghiệp vụ nền; UC-02 và UC-03 là ý tưởng mới cho bản mobile.')"],
 ["'LUỒNG MỞ RỘNG'","'Ý TƯỞNG MỚI CHO MOBILE'"],
 ["'UC-02  •  Chatbot hỗ trợ'","'UC-02  •  Chatbot qua API'"],
 ["slide(5,'Sơ đồ Use Case','Tác nhân chính là người dùng; AI và dịch vụ ảnh chỉ tham gia các luồng tương ứng.')","slide(5,'Sơ đồ Use Case đề xuất cho bản mobile','Chatbot và chụp ảnh là luồng mới; phần còn lại kế thừa nghiệp vụ của dự án web.')"],
 ["'HỆ THỐNG LỊCH TRÌNH'","'APP LỊCH TRÌNH MOBILE  •  ĐỀ XUẤT'"],
 ["slide(7,'Công nghệ lõi và kiến trúc','Phân lớp để hỗ trợ offline, đồng bộ dữ liệu và tích hợp AI an toàn.')","slide(7,'Kiến trúc dự kiến cho bản mobile','Đề xuất dùng Android client với API nền hiện có; route chatbot và lưu ảnh cần bổ sung.')"],
 ["d:'JWT • bcrypt\\nXác thực / phân quyền'","d:'API nền + route mới\\nJWT • bcrypt'"],
 ["h:'DỊCH VỤ',t:'MongoDB\\nGemini API',d:'Dữ liệu cloud\\nChatbot qua server'","h:'DỊCH VỤ MỞ RỘNG',t:'MongoDB\\nGemini API',d:'Dữ liệu cloud\\nAI API mới cho mobile'"],
 ["slide(8,'Chatbot và kết nối API','Chatbot hỗ trợ lập kế hoạch học tập, duy trì thói quen và nhìn lại tiến độ.')","slide(8,'Ý tưởng chatbot và kết nối API','Chức năng đề xuất mới; backend hiện tại cần thêm endpoint cho ứng dụng mobile.')"],
 ["slide(9,'Khoảnh khắc học tập và làm việc','Chụp một khoảnh khắc nỗ lực; mặc định riêng tư, người dùng chủ động chia sẻ.')","slide(9,'Ý tưởng: Khoảnh khắc học tập và làm việc','Tính năng mới đề xuất; ảnh mặc định riêng tư, người dùng tự chọn chia sẻ.')"],
 ["'LUỒNG SỬ DỤNG'","'LUỒNG DỰ KIẾN'"],
 ["'POST /api/ai/chat — gửi câu hỏi và nhận trả lời.'","'POST /api/ai/chat — endpoint mới, gửi câu hỏi và nhận trả lời.'"],
 ["s.speakerNotes.text='Chatbot là chức năng đề xuất. Backend cần thêm POST /api/ai/chat và giữ API key trong biến môi trường server; không gửi key từ app.'","s.speakerNotes.text='Chatbot chưa có trong backend hiện tại. Cần bổ sung POST /api/ai/chat và giữ API key trong biến môi trường server; không gửi key từ app.'"]
];
for(const [a,b] of pairs){if(!c.includes(a)) throw new Error('Missing replacement: '+a);c=c.replace(a,b);}
await fs.writeFile(p,c,'utf8');

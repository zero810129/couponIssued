개발프레임워크 : 서버 : NODE.JS 화면 :PUG  

문제 해결 전략  
 . 안정적인 데이터 저장을 위하여 my-sql 사용  
 . 간단한 서버 구축이 필요하므로, 가볍고 쉽게 구축할수 있는 node.js 사용  
 . 단위테스트를 하기 위한 화면 구성을 위하여 PUG 사용  
 . DB CRUD를 이용하기 위하여 sequelize 사용  
 . 로그인 로직 구현을 위하여 passport 사용 
 . 대량의 데이터 저장시 문제점 해결  
   . 대량의 데이터 저장때문에 My sql의 설정 변경 : max_allowed_packet : 100M로 증가  
   . API 1 호출시 대량건 생성 시 타임아웃이 걸려, 강제로 해당  API는 타임아웃 시간 10분으로 증가  
 
빌드 방법  
 . Visual Studio Code 설치 https://code.visualstudio.com/  
 . my-sql 설치 https://dev.mysql.com/downloads/installer/  
   . DB생성 :     "username": "root", "password": "q1w2e3r4", "database": "couponDB", "host": "127.0.0.1"  
 . 노드, npm 설치하기 https://nodejs.org/en/  
 . https://github.com/zero810129/couponIssued 에서 소스 다운로드    
 . 다운로드 받은 소스 VScode로 열어 "npm i" 로 모듈 다운로드      

 실행 방법  
  . "npm start"로 서버 기동  
  . http://localhost:8002/ 접속  
  . 로그인 한상태에서만 API를 사용할수 있으므로, 회원가입 진행  
  . 가입한 사용자로 로그인  
  . API 호출 (1-> 6) 테스트  
  . API 7호출 방법  
    . 쿠폰 만료일자는 생성시 1달로 세팅하므로, 7번 확인을 위해서는 my-sql 에서 발급된 쿠폰의 정보 수정 필요.   
  . ex1.소스파일에 있는 임시 쿠폰번호 CSV 업로드 기능 추가  
  . ex2.추가 다른 서버에서 호출하는 API 확인을 위해 도메인 등록 후 테스트 가능.  
     . https://github.com/zero810129/couponIssuedCall 에서 소스 다운  
     . "npm i"로 모듈 설치 
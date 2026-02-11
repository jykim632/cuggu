interface PhoneFrameProps {
  model: 'iphone' | 'galaxy';
}

export function PhoneFrame({ model }: PhoneFrameProps) {
  if (model === 'iphone') {
    return (
      <div className="absolute inset-0 -m-3">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-[3rem] shadow-2xl">
          {/* 내부 베젤 */}
          <div className="absolute inset-[3px] bg-black rounded-[2.8rem]" />

          {/* Dynamic Island */}
          <div className="absolute top-[25px] left-1/2 -translate-x-1/2 w-[100px] h-[30px] bg-black rounded-full z-20" />

          {/* 측면 버튼들 */}
          <div className="absolute left-[-3px] top-[100px] w-[3px] h-[28px] bg-slate-700 rounded-l-sm" />
          <div className="absolute left-[-3px] top-[150px] w-[3px] h-[50px] bg-slate-700 rounded-l-sm" />
          <div className="absolute left-[-3px] top-[210px] w-[3px] h-[50px] bg-slate-700 rounded-l-sm" />
          <div className="absolute right-[-3px] top-[180px] w-[3px] h-[70px] bg-slate-700 rounded-r-sm" />

          {/* 하단 스피커 & 충전 포트 */}
          <div className="absolute bottom-[12px] left-1/2 -translate-x-1/2 flex items-center gap-3">
            <div className="flex gap-[3px]">
              {[...Array(6)].map((_, i) => (
                <div key={`left-${i}`} className="w-[3px] h-[3px] bg-slate-700 rounded-full" />
              ))}
            </div>
            <div className="w-[30px] h-[4px] bg-slate-700 rounded-full" />
            <div className="flex gap-[3px]">
              {[...Array(6)].map((_, i) => (
                <div key={`right-${i}`} className="w-[3px] h-[3px] bg-slate-700 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 -m-3">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-[2.5rem] shadow-2xl">
        {/* 내부 베젤 */}
        <div className="absolute inset-[3px] bg-black rounded-[2.3rem]" />

        {/* 펀치홀 카메라 */}
        <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[12px] h-[12px] bg-black rounded-full z-20 ring-[1px] ring-slate-700" />

        {/* 측면 버튼들 */}
        <div className="absolute left-[-3px] top-[120px] w-[3px] h-[50px] bg-slate-600 rounded-l-sm" />
        <div className="absolute left-[-3px] top-[180px] w-[3px] h-[50px] bg-slate-600 rounded-l-sm" />
        <div className="absolute right-[-3px] top-[150px] w-[3px] h-[60px] bg-slate-600 rounded-r-sm" />

        {/* 하단 스피커 & 충전 포트 */}
        <div className="absolute bottom-[12px] left-1/2 -translate-x-1/2 flex items-center gap-4">
          <div className="flex gap-[2px]">
            {[...Array(8)].map((_, i) => (
              <div key={`left-${i}`} className="w-[2px] h-[2px] bg-slate-600 rounded-full" />
            ))}
          </div>
          <div className="w-[35px] h-[5px] bg-slate-600 rounded-sm" />
          <div className="flex gap-[2px]">
            {[...Array(8)].map((_, i) => (
              <div key={`right-${i}`} className="w-[2px] h-[2px] bg-slate-600 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


export default function Home() {
  return (
    <>
      <div className="flex justify-start items-center flex-col w-[100%] h-[600] bg-(--background-second) rounded-[30px] p-[20px]">
        <span>Ставки</span>
        <div className="w-[100%] h-[100%] bg-(--secondary) flex justify-center items-center flex-row gap-[20px] p-[20px]">
          <div className="w-[30%] h-[100%] bg-(--primary)">
            <span>Баланс</span>
            <span>--$</span>
            <span>24h: --%</span>
            <span>7d: --%</span>
            <span>1m: --%</span>
          </div>
          <div className="w-[100%] h-[100%] bg-(--primary)">
            <div>
              <span>Последние ставки</span>
              <span>[table]</span>
              <span>[chart]</span>
            </div>
            <div>[table]/[chart]</div>
          </div>
        </div>
      </div>

      <div className="flex justify-start items-center flex-col w-[100%] h-[600] bg-(--background-second) rounded-[30px] p-[20px]">
        <span>Тренчи</span>
        <div className="w-[100%] h-[100%] bg-(--secondary) flex justify-center items-center flex-row gap-[20px] p-[20px]">
          <div className="w-[30%] h-[100%] bg-(--primary)">
            <span>Баланс</span>
            <span>--$</span>
            <span>24h: --%</span>
            <span>7d: --%</span>
            <span>1m: --%</span>
          </div>
          <div className="w-[100%] h-[100%] bg-(--primary)">
            <div>
              <span>Последние флипы</span>
              <span>[table]</span>
              <span>[chart]</span>
            </div>
            <div>[table]/[chart]</div>
          </div>
        </div>
      </div>
    </>
  );
}

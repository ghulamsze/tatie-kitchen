import React from 'react';
import { useMenuStore } from '../../../stores/menuStore.ts';
import { useShopStore } from '../../../stores/shopStore.ts';

export interface PrintMenuDocumentProps {
  isMargin4433?: boolean;
  isInkSaver?: boolean;
  isVisibleInPreview?: boolean;
}

export const PrintMenuDocument: React.FC<PrintMenuDocumentProps> = ({
  isMargin4433 = false,
  isInkSaver = false,
  isVisibleInPreview = false,
}) => {
  const { shop } = useShopStore();
  const { items } = useMenuStore();

  const getPrice = (name: string, fallback: number) => {
    const found = items.find((i) => i.name.toLowerCase().trim() === name.toLowerCase().trim());
    const val = found ? found.price_idr : fallback;
    return (val / 1000).toFixed(3).replace(',', '.');
  };

  // Group definitions
  const page2Groups = [
    {
      title: 'Nasi goreng',
      items: [
        { name: 'Nasi Goreng Telur', price: 20000 },
        { name: 'Nasi Goreng Telur Ayam Suwir', price: 25000 },
        { name: 'Nasi Goreng Ayam', price: 33000 },
        { name: 'Nasi Goreng Ayam Komplit', price: 38000 },
        { name: 'Nasi Goreng Mercon Telur', price: 25000 },
        { name: 'Nasi Goreng Mercon Ayam', price: 35000 },
        { name: 'Nasi Goreng Mercon Komplit', price: 40000 },
      ],
    },
    {
      title: 'Nasi ayam',
      items: [
        { name: 'Nasi Ayam Geprek', price: 25000 },
        { name: 'Nasi Ayam Crispy', price: 25000 },
        { name: 'Nasi Ayam Crispy Lava', price: 30000 },
        { name: 'Nasi Ayam Lalap', price: 35000 },
        { name: 'Nasi Ayam Penyet', price: 35000 },
        { name: 'Nasi Ayam Bakar', price: 35000 },
      ],
    },
    {
      title: 'Makanan berkuah',
      items: [
        { name: 'Soto Ayam', price: 25000 },
        { name: 'Coto Makassar', price: 30000 },
      ],
    },
    {
      title: 'Mie',
      items: [
        { name: 'Mie Titi', price: 30000 },
        { name: 'Mie Goreng Telur', price: 25000 },
        { name: 'Mie Goreng Ayam', price: 35000 },
        { name: 'Mie Goreng Komplit', price: 40000 },
        { name: 'Mie Tek Tek', price: 30000 },
        { name: 'Indomie Goreng', price: 20000 },
      ],
    },
  ];

  const page3Groups = [
    {
      title: 'Terlaris',
      items: [
        { name: 'Nasi Goreng Telur', price: 20000 },
        { name: 'Nasi Ayam Penyet', price: 35000 },
        { name: 'Nasi Ayam Geprek', price: 25000 },
        { name: 'Gula Aren Coffee', price: 15000 },
        { name: 'Cappuccino', price: 15000 },
        { name: 'Brown Sugar', price: 15000 },
        { name: 'Milo', price: 15000 },
      ],
    },
    {
      title: 'Burger dan roti',
      items: [
        { name: 'Burger Telur', price: 20000 },
        { name: 'Burger Daging', price: 20000 },
        { name: 'Burger Komplit', price: 25000 },
        { name: 'Roti Bakar', price: 25000 },
        { name: 'Roti Jhon', price: 30000 },
        { name: 'Kebab', price: 30000 },
      ],
    },
    {
      title: 'Camilan',
      items: [
        { name: 'Nugget', price: 15000 },
        { name: 'Lekor', price: 15000 },
        { name: 'Sosis Goreng', price: 15000 },
        { name: 'Platter', price: 25000 },
        { name: 'Pisang Nugget Cokelat', price: 15000 },
        { name: 'Pisang Nugget Keju', price: 15000 },
        { name: 'Pisang Nugget Cokelat Keju', price: 18000 },
      ],
    },
    {
      title: 'Kopi panas',
      items: [
        { name: 'Kopi Hitam', price: 10000 },
        { name: 'Kopi Susu', price: 15000 },
        { name: 'Americano', price: 15000 },
        { name: 'Cappuccino', price: 15000 },
      ],
    },
    {
      title: 'Teh dan cokelat panas',
      items: [
        { name: 'Teh', price: 5000 },
        { name: 'Teh Susu', price: 15000 },
        { name: 'Cokelat Ori', price: 15000 },
        { name: 'Milo', price: 15000 },
      ],
    },
  ];

  const page4Groups = [
    {
      title: 'Es kopi',
      items: [
        { name: 'Americano', price: 10000 },
        { name: 'Cappuccino', price: 15000 },
        { name: 'Mochachino', price: 15000 },
        { name: 'Latte Coffee', price: 15000 },
        { name: 'Kopi Susu', price: 15000 },
        { name: 'Gula Aren Coffee', price: 15000 },
        { name: 'Butterscote Latte Coffee', price: 15000 },
      ],
    },
    {
      title: 'Es kopi rasa dan cream',
      items: [
        { name: 'Tiramisu Coffee', price: 15000 },
        { name: 'Hazelnut Coffee', price: 15000 },
        { name: 'Vanila Coffee', price: 15000 },
        { name: 'Strawberry Coffee', price: 15000 },
        { name: 'Gula Aren Coffee Cream', price: 20000 },
        { name: 'Panda Coffee Cream', price: 20000 },
        { name: 'Melon Coffee Cream', price: 20000 },
      ],
    },
    {
      title: 'Teh dan segar',
      items: [
        { name: 'Es Teh', price: 5000 },
        { name: 'Jeruk', price: 10000 },
        { name: 'Lemon Tea', price: 10000 },
        { name: 'Teh Tarik', price: 15000 },
        { name: 'Thai Tea', price: 15000 },
        { name: 'Susu Pandan', price: 15000 },
      ],
    },
    {
      title: 'Cokelat dan susu',
      items: [
        { name: 'Cokelat Ori', price: 15000 },
        { name: 'Cokelat Almond', price: 15000 },
        { name: 'Milo', price: 15000 },
        { name: 'Cadburry', price: 15000 },
        { name: 'Brown Sugar', price: 15000 },
        { name: 'Butterscote Latte', price: 15000 },
        { name: 'Extrajoss Susu', price: 15000 },
      ],
    },
    {
      title: 'Rasa lain',
      items: [
        { name: 'Taro', price: 15000 },
        { name: 'Strawberry', price: 15000 },
        { name: 'Mangga Milky', price: 15000 },
        { name: 'Red Velvet', price: 15000 },
        { name: 'Vanila', price: 15000 },
      ],
    },
    {
      title: 'Minuman spesial',
      items: [
        { name: 'Green Tea', price: 15000 },
        { name: 'Matcha', price: 15000 },
        { name: 'Nestum', price: 15000 },
        { name: 'Mangga Squash', price: 15000 },
        { name: 'Blue Curacao Squash', price: 15000 },
        { name: 'Strawberry Squash', price: 15000 },
      ],
    },
  ];

  return (
    <div
      id="mps-root"
      className={`tk-print-document-root ${isVisibleInPreview ? 'visible' : ''}`}
      style={{
        display: isVisibleInPreview ? 'block' : undefined,
      }}
    >
      <div
        id="mp"
        className={`${isMargin4433 ? 'm4433' : ''} ${isInkSaver ? 'ink' : ''}`}
      >
        {/* HALAMAN 1: SAMPUL DEPAN (A4 COVER) */}
        <div className="pgw">
          <div className="pg cv">
            <div className="lat" />
            <div className="cg" />
            <span className="eb">Menu</span>
            <div className="wmk">
              <span>{shop.name ? shop.name.split(' ')[0] : 'Tati’e'}</span>
              <span className="ac">
                {shop.name ? shop.name.split(' ').slice(1).join(' ') || 'Kitchen' : 'Kitchen'}
              </span>
            </div>
            <div className="cats">
              <span>Makanan</span>
              <i />
              <span>Mie</span>
              <i />
              <span>Snack</span>
              <i />
              <span>Minuman</span>
            </div>
          </div>
        </div>

        {/* HALAMAN 2: MAKANAN DAN MIE */}
        <div className="pgw">
          <div className="pg">
            <div className="pph">
              <span>{shop.name || 'Tati’e Kitchen'}</span>
              <span>2 / 4</span>
            </div>
            <h2>Makanan dan mie</h2>
            <div className="cols">
              {page2Groups.map((grp) => (
                <div key={grp.title} className="mg">
                  <h3>{grp.title}</h3>
                  <div className="dv" />
                  {grp.items.map((item) => (
                    <div key={item.name} className="mr">
                      <b>{item.name}</b>
                      <span className="ppr">{getPrice(item.name, item.price)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HALAMAN 3: CAMILAN DAN MINUMAN PANAS */}
        <div className="pgw">
          <div className="pg">
            <div className="pph">
              <span>{shop.name || 'Tati’e Kitchen'}</span>
              <span>3 / 4</span>
            </div>
            <h2>Camilan dan minuman panas</h2>
            <div className="cols">
              {page3Groups.map((grp) => (
                <div key={grp.title} className="mg">
                  <h3>{grp.title}</h3>
                  <div className="dv" />
                  {grp.items.map((item) => (
                    <div key={item.name} className="mr">
                      <b>{item.name}</b>
                      <span className="ppr">{getPrice(item.name, item.price)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HALAMAN 4: MINUMAN DINGIN */}
        <div className="pgw">
          <div className="pg">
            <div className="pph">
              <span>{shop.name || 'Tati’e Kitchen'}</span>
              <span>4 / 4</span>
            </div>
            <h2>Minuman dingin</h2>
            <div className="cols">
              {page4Groups.map((grp) => (
                <div key={grp.title} className="mg">
                  <h3>{grp.title}</h3>
                  <div className="dv" />
                  {grp.items.map((item) => (
                    <div key={item.name} className="mr">
                      <b>{item.name}</b>
                      <span className="ppr">{getPrice(item.name, item.price)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintMenuDocument;

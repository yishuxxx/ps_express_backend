-- --------------------------------------------------------

--
-- Table structure for table `sy_order`
--

CREATE TABLE `sy_order` (
  `id_order` int(11) NOT NULL,
  `no` varchar(10) DEFAULT NULL,
  `id_page` int(11) DEFAULT NULL,
  `note` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `sy_order`
--
ALTER TABLE `sy_order`
  ADD KEY `id_page` (`id_page`),
  ADD KEY `id_order` (`id_order`);
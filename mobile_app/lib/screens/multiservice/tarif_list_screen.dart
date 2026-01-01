import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/theme.dart';
import '../../models/multiservice_models.dart';
import '../../services/multiservice_service.dart';
import '../../widgets/modal_components.dart';
import 'tarif_form_modal.dart';
import 'paliers_remise_modal.dart';

class TarifListScreen extends StatefulWidget {
  const TarifListScreen({super.key});

  @override
  State<TarifListScreen> createState() => _TarifListScreenState();
}

class _TarifListScreenState extends State<TarifListScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<TarifService> _tarifs = [];
  bool _isLoading = true;
  String? _error;
  String _searchTerm = '';

  @override
  void initState() {
    super.initState();
    _loadTarifs();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadTarifs() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await multiserviceService.getTarifs(search: _searchTerm);

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result.success) {
          _tarifs = result.tarifs;
          // Tri : Actifs en premier, puis alphabétique
          _tarifs.sort((a, b) {
            if (a.actif && !b.actif) return -1;
            if (!a.actif && b.actif) return 1;
            return a.nomService.toLowerCase().compareTo(
              b.nomService.toLowerCase(),
            );
          });
        } else {
          _error = result.error;
        }
      });
    }
  }

  void _onSearch(String value) {
    setState(() {
      _searchTerm = value;
    });
    _loadTarifs();
  }

  void _showTarifForm([TarifService? tarif]) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) =>
          TarifFormModal(tarif: tarif, onSuccess: _loadTarifs),
    );
  }

  void _showPaliersModal(TarifService tarif) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) =>
          PaliersRemiseModal(tarif: tarif, onChanged: _loadTarifs),
    );
  }

  Future<void> _confirmDelete(TarifService tarif) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer le tarif'),
        content: Text(
          'Voulez-vous vraiment supprimer le tarif "${tarif.nomService}" ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.error),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final response = await multiserviceService.deleteTarif(tarif.id);
      if (mounted) {
        if (response.success) {
          showModernSnackBar(
            context,
            message: 'Tarif supprimé',
            type: SnackBarType.success,
          );
          _loadTarifs();
        } else {
          String msg = response.error ?? 'Erreur lors de la suppression';
          if (response.statusCode == 409) {
            msg = 'Ce tarif est déjà consommé et ne peut pas être supprimé.';
          }
          showModernSnackBar(context, message: msg, type: SnackBarType.error);
        }
      }
    }
  }

  Future<void> _importTarifs() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Importer les tarifs'),
        content: const Text(
          'Voulez-vous importer les tarifs standards par défaut ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Importer'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() => _isLoading = true);
      final success = await multiserviceService.importTarifsDefaut();
      if (mounted) {
        if (success) {
          showModernSnackBar(
            context,
            message: 'Tarifs importés !',
            type: SnackBarType.success,
          );
          _loadTarifs();
        } else {
          showModernSnackBar(
            context,
            message: 'Erreur lors de l\'importation',
            type: SnackBarType.error,
          );
          setState(() => _isLoading = false);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: Text(
          'Gestion des Tarifs',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.download_outlined),
            onPressed: _importTarifs,
            tooltip: 'Importer les tarifs par défaut',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showTarifForm(),
        backgroundColor: AppTheme.primaryBlue,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: Column(
        children: [
          // Barre de recherche
          Container(
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: AppTheme.cardShadow,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
            ),
            child: ModernTextField(
              controller: _searchController,
              label: 'Recherche',
              hint: 'Rechercher un service...',
              prefixIcon: const Icon(
                Icons.search,
                color: AppTheme.textSecondary,
              ),
              suffixIcon: _searchTerm.isNotEmpty
                  ? IconButton(
                      icon: const Icon(
                        Icons.clear,
                        color: AppTheme.textSecondary,
                      ),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _searchTerm = '');
                        _loadTarifs();
                      },
                    )
                  : null,
              onChanged: (v) {
                setState(() => _searchTerm = v);
                Future.delayed(const Duration(milliseconds: 500), () {
                  if (mounted && v == _searchController.text) {
                    _loadTarifs();
                  }
                });
              },
              onSubmitted: (v) => _onSearch(v),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _loadTarifs,
                    child: _tarifs.isEmpty
                        ? ListView(
                            children: [
                              Center(
                                child: Padding(
                                  padding: const EdgeInsets.only(top: 100),
                                  child: Column(
                                    children: [
                                      Icon(
                                        Icons.inventory_2_outlined,
                                        size: 64,
                                        color: Colors.grey.shade300,
                                      ),
                                      const SizedBox(height: 16),
                                      Text(
                                        _error ?? 'Aucun tarif trouvé',
                                        style: GoogleFonts.inter(
                                          color: AppTheme.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _tarifs.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final tarif = _tarifs[index];
                              return _TarifCard(
                                tarif: tarif,
                                onEdit: () => _showTarifForm(tarif),
                                onDelete: () => _confirmDelete(tarif),
                                onManagePaliers: () => _showPaliersModal(tarif),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _TarifCard extends StatelessWidget {
  final TarifService tarif;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onManagePaliers;

  const _TarifCard({
    required this.tarif,
    required this.onEdit,
    required this.onDelete,
    required this.onManagePaliers,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Column(
          children: [
            if (!tarif.actif)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 4),
                color: Colors.grey.shade100,
                child: Center(
                  child: Text(
                    'INACTIF',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              tarif.nomService,
                              style: GoogleFonts.inter(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            if (tarif.categorieNom != null)
                              Text(
                                tarif.categorieNom!,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '${tarif.prixUnitaire.toStringAsFixed(0)} Ar',
                            style: GoogleFonts.outfit(
                              fontWeight: FontWeight.w900,
                              fontSize: 18,
                              color: AppTheme.primaryBlue,
                            ),
                          ),
                          if (tarif.totalPaliers > 0)
                            Container(
                              margin: const EdgeInsets.only(top: 4),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.purple.shade50,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '${tarif.totalPaliers} palier(s)',
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.purple.shade700,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                  if (tarif.consommations.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      'Produits consommés :',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: tarif.consommations.map((c) {
                        return Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${c.produitNom} (x${c.quantite})',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: AppTheme.primaryBlue,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      _ActionButton(
                        icon: Icons.percent,
                        color: Colors.purple,
                        onPressed: onManagePaliers,
                        tooltip: 'Remises',
                      ),
                      const SizedBox(width: 8),
                      _ActionButton(
                        icon: Icons.edit_outlined,
                        color: AppTheme.primaryBlue,
                        onPressed: onEdit,
                        tooltip: 'Modifier',
                      ),
                      const SizedBox(width: 8),
                      _ActionButton(
                        icon: Icons.delete_outline,
                        color: AppTheme.error,
                        onPressed: onDelete,
                        tooltip: 'Supprimer',
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onPressed;
  final String tooltip;

  const _ActionButton({
    required this.icon,
    required this.color,
    required this.onPressed,
    required this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(icon, size: 22, color: color),
      onPressed: onPressed,
      tooltip: tooltip,
      constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
      padding: EdgeInsets.zero,
    );
  }
}
